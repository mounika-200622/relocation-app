import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, notFound, type SessionUser } from "@/lib/api";
import { insertMessage, unreadCounts } from "@/lib/mongo/chat";

/** Conversations always store the smaller user id first (enforced by trg_conversation_bi). */
export function orderedPair(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

export async function isBlocked(a: number, b: number) {
  const n = await prisma.block.count({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } });
  return n > 0;
}

/** Public display name: business display name when there is one. Never email/phone. */
export async function displayNames(ids: number[]) {
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, role: true, businessProfile: { select: { displayName: true, isVerified: true } } } });
  return new Map(users.map((u) => [u.id, { name: u.businessProfile?.displayName ?? u.name, role: u.role, verified: u.businessProfile?.isVerified ?? false }]));
}

/**
 * Works out who `me` wants to talk to and in which context, applying the rules:
 *  - a user can message the owner of a listing;
 *  - anyone can message the author of a roommate request, and the listing owner can
 *    message requesters on their listing;
 *  - nobody can message themselves or someone who blocked them (or whom they blocked).
 */
export async function resolveChatTarget(me: SessionUser, input: { otherUserId?: number; listingId?: number; requestId?: number }) {
  let otherId = input.otherUserId ?? null;
  let listingId = input.listingId ?? null;
  let requestId: number | null = null;

  if (input.requestId) {
    const r = await prisma.roommateRequest.findUnique({ where: { id: input.requestId }, select: { id: true, requesterId: true, listingId: true, listing: { select: { ownerId: true } } } });
    if (!r) throw notFound("That roommate request no longer exists.");
    requestId = r.id;
    listingId = r.listingId;
    // the requester talking to the owner, or anyone talking to the requester
    otherId = me.id === r.requesterId ? r.listing.ownerId : r.requesterId;
  } else if (listingId) {
    const l = await prisma.listing.findUnique({ where: { id: listingId }, select: { ownerId: true } });
    if (!l) throw notFound("Listing not found.");
    otherId ??= l.ownerId;
  }
  if (!otherId) throw badRequest("Say who you want to message.");
  if (otherId === me.id) throw badRequest("You can't message yourself.");
  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true, isActive: true } });
  if (!other || !other.isActive) throw notFound("That person is no longer on Nira.");
  if (await isBlocked(me.id, otherId)) throw forbidden("You can't message this person.");
  return { otherId, listingId, requestId };
}

/**
 * Finds or creates the conversation (one per pair + listing) and optionally sends the
 * first message. The MySQL header is written in a transaction; the message body goes to
 * MongoDB afterwards and the preview is only updated once that insert succeeded.
 */
export async function startConversation(me: SessionUser, input: { otherUserId?: number; listingId?: number; requestId?: number; text?: string }) {
  const t = await resolveChatTarget(me, input);
  const [userAId, userBId] = orderedPair(me.id, t.otherId);
  const contextKey = t.listingId ?? 0;

  const convo = await prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findUnique({ where: { userAId_userBId_contextKey: { userAId, userBId, contextKey } }, select: { id: true } });
    if (existing) {
      if (t.requestId) await tx.conversation.update({ where: { id: existing.id }, data: { roommateRequestId: t.requestId } });
      return existing;
    }
    return tx.conversation.create({ data: { userAId, userBId, contextKey, listingId: t.listingId, roommateRequestId: t.requestId }, select: { id: true } });
  });

  if (input.text) await sendMessage(convo.id, me.id, input.text);
  return convo.id;
}

export async function loadConversationFor(conversationId: number, userId: number) {
  const c = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true, userAId: true, userBId: true, listingId: true, roommateRequestId: true,
      listing: { select: { id: true, title: true, price: true, currency: true, photos: { take: 1, orderBy: { position: "asc" }, select: { url: true } }, city: { select: { name: true } } } },
    },
  });
  // Same 404 for "doesn't exist" and "not yours": never reveal other people's chats.
  if (!c || (c.userAId !== userId && c.userBId !== userId)) throw notFound("Conversation not found.");
  return c;
}

export async function sendMessage(conversationId: number, senderId: number, text: string) {
  const msg = await insertMessage(conversationId, senderId, text);
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date(msg.sentAt), lastMessagePreview: text.slice(0, 160), lastSenderId: senderId },
  });
  return msg;
}

export async function inbox(userId: number) {
  const convos = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    select: {
      id: true, userAId: true, userBId: true, lastMessageAt: true, lastMessagePreview: true, lastSenderId: true,
      listing: { select: { id: true, title: true, photos: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } },
      roommateRequestId: true,
    },
  });
  const otherIds = convos.map((c) => (c.userAId === userId ? c.userBId : c.userAId));
  const [names, unread, blocks] = await Promise.all([
    displayNames(otherIds),
    unreadCounts(convos.map((c) => c.id), userId).catch(() => new Map<number, number>()),
    prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
  ]);
  const blocked = new Set(blocks.map((b) => b.blockedId));
  return convos.map((c) => {
    const otherId = c.userAId === userId ? c.userBId : c.userAId;
    const who = names.get(otherId);
    return {
      id: c.id,
      other: { id: otherId, name: who?.name ?? "Former member", role: who?.role ?? "USER", verified: who?.verified ?? false, blocked: blocked.has(otherId) },
      listing: c.listing ? { id: c.listing.id, title: c.listing.title, coverUrl: c.listing.photos[0]?.url ?? null } : null,
      isRoommateChat: Boolean(c.roommateRequestId),
      lastMessageAt: c.lastMessageAt.toISOString(),
      lastMessagePreview: c.lastMessagePreview,
      lastFromMe: c.lastSenderId === userId,
      unread: unread.get(c.id) ?? 0,
    };
  });
}

export type InboxItem = Awaited<ReturnType<typeof inbox>>[number];
