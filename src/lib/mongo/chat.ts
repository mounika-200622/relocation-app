import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo/client";

export type MessageDoc = {
  _id: ObjectId;
  conversationId: number; // FK (logical) to MySQL Conversation.id
  senderId: number; // FK (logical) to MySQL User.id
  text: string;
  sentAt: Date;
  readAt: Date | null;
};

export type MessageDTO = { id: string; senderId: number; text: string; sentAt: string; readAt: string | null };

const toDTO = (m: MessageDoc): MessageDTO => ({
  id: m._id.toHexString(),
  senderId: m.senderId,
  text: m.text,
  sentAt: m.sentAt.toISOString(),
  readAt: m.readAt ? m.readAt.toISOString() : null,
});

async function col() {
  return (await getDb()).collection<MessageDoc>("messages");
}

export async function insertMessage(conversationId: number, senderId: number, text: string): Promise<MessageDTO> {
  const doc: MessageDoc = { _id: new ObjectId(), conversationId, senderId, text, sentAt: new Date(), readAt: null };
  await (await col()).insertOne(doc);
  return toDTO(doc);
}

/**
 * Messages of a conversation in chronological order. With `after`, returns only newer
 * messages (ObjectIds grow monotonically), which is what the 3-second poll uses.
 */
export async function listMessages(conversationId: number, opts: { after?: string; limit?: number } = {}) {
  const filter: Record<string, unknown> = { conversationId };
  if (opts.after) {
    if (!ObjectId.isValid(opts.after)) return [];
    filter._id = { $gt: new ObjectId(opts.after) };
    const docs = await (await col()).find(filter).sort({ _id: 1 }).limit(opts.limit ?? 200).toArray();
    return docs.map(toDTO);
  }
  // first load: the latest N, returned oldest→newest
  const docs = await (await col()).find(filter).sort({ _id: -1 }).limit(opts.limit ?? 200).toArray();
  return docs.reverse().map(toDTO);
}

/** Marks everything the other person sent as read. Returns how many changed. */
export async function markRead(conversationId: number, readerId: number) {
  const r = await (await col()).updateMany(
    { conversationId, senderId: { $ne: readerId }, readAt: null },
    { $set: { readAt: new Date() } },
  );
  return r.modifiedCount;
}

/**
 * Unread counts per conversation for one user, via an aggregation pipeline:
 *   $match unread messages in my conversations not sent by me → $group by conversation.
 */
export async function unreadCounts(conversationIds: number[], userId: number): Promise<Map<number, number>> {
  if (conversationIds.length === 0) return new Map();
  const rows = await (await col())
    .aggregate<{ _id: number; count: number }>([
      { $match: { conversationId: { $in: conversationIds }, readAt: null, senderId: { $ne: userId } } },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(rows.map((r) => [r._id, r.count]));
}

/** Messages sent per day for the last N days (admin analytics). */
export async function messagesPerDay(days = 14) {
  const since = new Date(Date.now() - days * 86_400_000);
  return (await col())
    .aggregate<{ _id: string; messages: number; senders: number }>([
      { $match: { sentAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$sentAt" } },
          messages: { $sum: 1 },
          senderSet: { $addToSet: "$senderId" },
        },
      },
      { $project: { messages: 1, senders: { $size: "$senderSet" } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
}

/** Total stored messages (dashboard tile). */
export async function messageCount() {
  return (await col()).estimatedDocumentCount();
}

/** Removes all messages of conversations that were deleted in MySQL. */
export async function deleteMessagesOf(conversationIds: number[]) {
  if (conversationIds.length === 0) return 0;
  const r = await (await col()).deleteMany({ conversationId: { $in: conversationIds } });
  return r.deletedCount;
}
