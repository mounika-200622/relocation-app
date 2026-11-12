import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, json, parseId, readJson, requireUser, route } from "@/lib/api";
import { loadOwnTrip } from "@/lib/trip/access";
import { regenerateTrip } from "@/lib/trip/generate";

type Ctx = { id: string };
const body = z.object({ action: z.enum(["regenerate", "duplicate", "share", "unshare"]) });

/** Itinerary actions: regenerate, duplicate, create/revoke a read-only share link. */
export const POST = route<Ctx>(async (req, { params }) => {
  const id = parseId((await params).id, "trip id");
  const user = await requireUser(["USER", "ADMIN"]);
  await loadOwnTrip(id, user.id);
  const { action } = await readJson(req, body);

  if (action === "regenerate") {
    enforceRateLimit(`trip:${user.id}`, 10, 10 * 60_000);
    return json(await regenerateTrip(id));
  }
  if (action === "share") {
    const t = await prisma.itinerary.findUniqueOrThrow({ where: { id }, select: { shareToken: true } });
    const token = t.shareToken ?? randomBytes(16).toString("hex");
    if (!t.shareToken) await prisma.itinerary.update({ where: { id }, data: { shareToken: token } });
    return json({ token, url: `/share/${token}` });
  }
  if (action === "unshare") {
    await prisma.itinerary.update({ where: { id }, data: { shareToken: null } });
    return json({ ok: true });
  }
  // duplicate: copy the itinerary row, its interests and all items in one transaction
  const copy = await prisma.$transaction(async (tx) => {
    const t = await tx.itinerary.findUniqueOrThrow({ where: { id }, include: { interests: true, items: true } });
    const { id: _id, createdAt: _c, updatedAt: _u, shareToken: _s, interests, items, ...rest } = t;
    const created = await tx.itinerary.create({ data: { ...rest, title: `${t.title} (copy)`.slice(0, 120) }, select: { id: true } });
    if (interests.length) await tx.itineraryInterest.createMany({ data: interests.map((i) => ({ itineraryId: created.id, interest: i.interest })) });
    if (items.length) await tx.itineraryItem.createMany({ data: items.map(({ id: _i, itineraryId: _it, ...item }) => ({ ...item, itineraryId: created.id })) });
    return created;
  });
  return json({ id: copy.id }, 201);
});
