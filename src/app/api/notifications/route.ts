import { json, requireUser, route } from "@/lib/api";
import { listNotifications, markNotificationsRead } from "@/lib/mongo/notifications";

export const GET = route(async () => {
  const user = await requireUser();
  return json({ items: await listNotifications(user.id).catch(() => []) });
});

/** Marks all of the user's notifications as read. */
export const POST = route(async () => {
  const user = await requireUser();
  await markNotificationsRead(user.id).catch(() => undefined);
  return json({ ok: true });
});
