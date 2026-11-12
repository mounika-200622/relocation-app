import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo/client";

export type NotificationType =
  | "ROOMMATE_REQUEST"
  | "REQUEST_ACCEPTED"
  | "REQUEST_DECLINED"
  | "LISTING_RENTED"
  | "NEW_MESSAGE"
  | "SYSTEM";

type NotificationDoc = {
  _id: ObjectId;
  userId: number;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  /** Free-form payload; shape depends on `type` (why this is a document, not a table). */
  data?: Record<string, unknown>;
  createdAt: Date;
  readAt: Date | null;
};

async function col() {
  return (await getDb()).collection<NotificationDoc>("notifications");
}

/** Fire-and-forget: a notification must never break the action that caused it. */
export async function notify(userId: number, n: { type: NotificationType; title: string; body?: string; link?: string; data?: Record<string, unknown> }) {
  try {
    await (await col()).insertOne({ _id: new ObjectId(), userId, ...n, createdAt: new Date(), readAt: null });
  } catch (err) {
    console.warn("[notify] skipped:", (err as Error).message);
  }
}

export async function listNotifications(userId: number, limit = 30) {
  const docs = await (await col()).find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((d) => ({
    id: d._id.toHexString(),
    type: d.type,
    title: d.title,
    body: d.body ?? null,
    link: d.link ?? null,
    createdAt: d.createdAt.toISOString(),
    read: d.readAt !== null,
  }));
}

export async function unreadNotificationCount(userId: number) {
  return (await col()).countDocuments({ userId, readAt: null });
}

export async function markNotificationsRead(userId: number) {
  await (await col()).updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
}

/** Notifications grouped by type for one user (aggregation used on the profile page). */
export async function notificationStats(userId: number) {
  return (await col())
    .aggregate<{ _id: NotificationType; total: number; unread: number }>([
      { $match: { userId } },
      { $group: { _id: "$type", total: { $sum: 1 }, unread: { $sum: { $cond: [{ $eq: ["$readAt", null] }, 1, 0] } } } },
      { $sort: { total: -1 } },
    ])
    .toArray();
}

export async function deleteNotificationsOf(userId: number) {
  await (await col()).deleteMany({ userId });
}
