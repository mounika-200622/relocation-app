import { prisma } from "@/lib/prisma";
import { json, requireUser, route } from "@/lib/api";
import { unreadCounts } from "@/lib/mongo/chat";
import { unreadNotificationCount } from "@/lib/mongo/notifications";

/** Totals for the navbar badges. MongoDB being down must not break navigation. */
export const GET = route(async () => {
  const user = await requireUser();
  const convos = await prisma.conversation.findMany({ where: { OR: [{ userAId: user.id }, { userBId: user.id }] }, select: { id: true } });
  const [byConvo, notifications] = await Promise.all([
    unreadCounts(convos.map((c) => c.id), user.id).catch(() => new Map<number, number>()),
    unreadNotificationCount(user.id).catch(() => 0),
  ]);
  const messages = [...byConvo.values()].reduce((a, b) => a + b, 0);
  return Response.json({ messages, notifications }, { headers: { "Cache-Control": "no-store" } });
});
