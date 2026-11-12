import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, parseId, requireUser, route } from "@/lib/api";

type Ctx = { id: string };

export const POST = route<Ctx>(async (_req, { params }) => {
  const blockedId = parseId((await params).id, "user id");
  const user = await requireUser();
  if (blockedId === user.id) throw badRequest("You can't block yourself.");
  const exists = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!exists) throw notFound("User not found.");
  await prisma.block.upsert({ where: { blockerId_blockedId: { blockerId: user.id, blockedId } }, update: {}, create: { blockerId: user.id, blockedId } });
  return json({ blocked: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const blockedId = parseId((await params).id, "user id");
  const user = await requireUser();
  await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId } });
  return json({ blocked: false });
});
