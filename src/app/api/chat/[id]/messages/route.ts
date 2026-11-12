import { z } from "zod";
import { enforceRateLimit, forbidden, json, parseId, readJson, readQuery, requireUser, route } from "@/lib/api";
import { displayNames, isBlocked, loadConversationFor, sendMessage } from "@/lib/chat";
import { listMessages, markRead } from "@/lib/mongo/chat";
import { sendMessageSchema } from "@/lib/validators/social";
import { num } from "@/lib/format";

type Ctx = { id: string };
const query = z.object({ after: z.string().regex(/^[a-f0-9]{24}$/i).optional().catch(undefined) });

/**
 * First load (no `after`): conversation details + latest messages.
 * Polling (`?after=<messageId>`): only messages newer than that id.
 * Reading also marks the other person's messages as read.
 */
export const GET = route<Ctx>(async (req, { params }) => {
  const id = parseId((await params).id, "conversation id");
  const user = await requireUser();
  const convo = await loadConversationFor(id, user.id);
  const { after } = readQuery(req, query);
  const messages = await listMessages(id, { after });
  if (messages.some((m) => m.senderId !== user.id && !m.readAt) || !after) await markRead(id, user.id);
  if (after) return json({ messages });

  const otherId = convo.userAId === user.id ? convo.userBId : convo.userAId;
  const names = await displayNames([otherId]);
  const who = names.get(otherId);
  return json({
    conversation: {
      id: convo.id,
      other: { id: otherId, name: who?.name ?? "Former member", role: who?.role ?? "USER", verified: who?.verified ?? false },
      listing: convo.listing
        ? { id: convo.listing.id, title: convo.listing.title, price: num(convo.listing.price), currency: convo.listing.currency, city: convo.listing.city.name, coverUrl: convo.listing.photos[0]?.url ?? null }
        : null,
      blocked: await isBlocked(user.id, otherId),
    },
    messages,
  });
});

export const POST = route<Ctx>(async (req, { params }) => {
  const id = parseId((await params).id, "conversation id");
  const user = await requireUser();
  enforceRateLimit(`chat-send:${user.id}`, 30, 60_000);
  const convo = await loadConversationFor(id, user.id);
  const otherId = convo.userAId === user.id ? convo.userBId : convo.userAId;
  if (await isBlocked(user.id, otherId)) throw forbidden("You can't message this person.");
  const { text } = await readJson(req, sendMessageSchema);
  const message = await sendMessage(id, user.id, text);
  return json({ message }, 201);
});
