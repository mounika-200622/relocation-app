import { prisma } from "@/lib/prisma";
import { json, notFound, parseId, readJson, requireUser, route } from "@/lib/api";
import { loadOwnTrip } from "@/lib/trip/access";
import { swapItemSchema } from "@/lib/validators/trip";
import { alternativesFor } from "@/lib/trip/generate";

type Ctx = { id: string; itemId: string };

async function load(params: Promise<Ctx>) {
  const p = await params;
  const id = parseId(p.id, "trip id");
  const itemId = parseId(p.itemId, "item id");
  const user = await requireUser(["USER", "ADMIN"]);
  await loadOwnTrip(id, user.id);
  const item = await prisma.itineraryItem.findFirst({ where: { id: itemId, itineraryId: id }, select: { id: true, title: true } });
  if (!item) throw notFound("Item not found.");
  return { id, itemId, item };
}

/** Up to three alternatives in the same price tier near the item. */
export const GET = route<Ctx>(async (_req, { params }) => {
  const { id, itemId } = await load(params);
  return json({ items: await alternativesFor(itemId, id) });
});

/** Swap the item for one of the alternatives (keeps day, slot and position). */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { id, itemId, item } = await load(params);
  const { poiId } = await readJson(req, swapItemSchema);
  const alt = (await alternativesFor(itemId, id)).find((a) => a.poiId === poiId);
  if (!alt) throw notFound("That alternative is no longer available.");
  const poi = await prisma.pOI.findUniqueOrThrow({ where: { id: poiId }, select: { name: true, lat: true, lng: true } });
  const prefix = item.title.match(/^(Breakfast|Lunch|Dinner): /)?.[0] ?? "";
  await prisma.itineraryItem.update({ where: { id: itemId }, data: { poiId, title: `${prefix}${poi.name}`.slice(0, 200), lat: poi.lat, lng: poi.lng, estimatedCost: alt.estimatedCost, listingId: null } });
  return json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { itemId } = await load(params);
  await prisma.itineraryItem.delete({ where: { id: itemId } });
  return json({ ok: true });
});
