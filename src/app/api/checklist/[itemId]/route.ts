import { prisma } from "@/lib/prisma";
import { json, notFound, parseId, requireUser, route } from "@/lib/api";

type Ctx = { itemId: string };

/** Tick a first-week checklist item. */
export const POST = route<Ctx>(async (_req, { params }) => {
  const itemId = parseId((await params).itemId, "item id");
  const user = await requireUser();
  const item = await prisma.checklistTemplate.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) throw notFound("Checklist item not found.");
  await prisma.userChecklistProgress.upsert({ where: { userId_itemId: { userId: user.id, itemId } }, update: {}, create: { userId: user.id, itemId } });
  return json({ done: true });
});

/** Untick it again. */
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const itemId = parseId((await params).itemId, "item id");
  const user = await requireUser();
  await prisma.userChecklistProgress.deleteMany({ where: { userId: user.id, itemId } });
  return json({ done: false });
});
