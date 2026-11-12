import { prisma } from "@/lib/prisma";
import { json, notFound, parseId, requireUser, route } from "@/lib/api";

type Ctx = { id: string };

export const POST = route<Ctx>(async (_req, { params }) => {
  const listingId = parseId((await params).id);
  const user = await requireUser(["USER", "ADMIN"]);
  const exists = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!exists) throw notFound("Listing not found.");
  await prisma.savedListing.upsert({ where: { userId_listingId: { userId: user.id, listingId } }, update: {}, create: { userId: user.id, listingId } });
  return json({ saved: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const listingId = parseId((await params).id);
  const user = await requireUser(["USER", "ADMIN"]);
  await prisma.savedListing.deleteMany({ where: { userId: user.id, listingId } });
  return json({ saved: false });
});
