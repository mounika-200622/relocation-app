import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, parseId, readJson, requireUser, route } from "@/lib/api";
import { loadOwnTrip } from "@/lib/trip/access";
import { addItemSchema } from "@/lib/validators/trip";
import { TRIP_FOOD, TRIP_STAY } from "@/lib/poi/categories";

type Ctx = { id: string };

/** Adds an item (a cached place or a custom entry) to a day; the budget meter recomputes. */
export const POST = route<Ctx>(async (req, { params }) => {
  const id = parseId((await params).id, "trip id");
  const user = await requireUser(["USER", "ADMIN"]);
  const trip = await loadOwnTrip(id, user.id);
  const input = await readJson(req, addItemSchema);
  if (input.dayNumber > trip.days) throw badRequest(`This trip has only ${trip.days} days.`);

  let title = input.title ?? "";
  let lat: number | null = null;
  let lng: number | null = null;
  let kind: "FOOD" | "ACTIVITY" | "STAY" = input.timeSlot === "LUNCH" || input.timeSlot === "DINNER" ? "FOOD" : "ACTIVITY";
  if (input.poiId) {
    const poi = await prisma.pOI.findUnique({ where: { id: input.poiId }, select: { name: true, lat: true, lng: true, category: true } });
    if (!poi) throw notFound("Place not found.");
    title ||= poi.name;
    lat = poi.lat;
    lng = poi.lng;
    kind = TRIP_STAY.includes(poi.category) ? "STAY" : TRIP_FOOD.includes(poi.category) ? "FOOD" : "ACTIVITY";
  }
  const last = await prisma.itineraryItem.aggregate({ where: { itineraryId: id, dayNumber: input.dayNumber }, _max: { position: true } });
  const item = await prisma.itineraryItem.create({
    data: {
      itineraryId: id, dayNumber: input.dayNumber, timeSlot: input.timeSlot, kind, position: (last._max.position ?? 0) + 1, poiId: input.poiId ?? null,
      title: title.slice(0, 200), estimatedCost: input.estimatedCost ?? 0, lat, lng, notes: input.notes ?? null,
    },
    select: { id: true },
  });
  return json(item, 201);
});
