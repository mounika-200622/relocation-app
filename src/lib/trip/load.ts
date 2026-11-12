import { prisma } from "@/lib/prisma";
import { num } from "@/lib/format";
import { summarize } from "@/lib/budget";

/** Everything the itinerary screen needs, serialisable for client components. */
export async function loadTrip(where: { id: number } | { shareToken: string }) {
  const t = await prisma.itinerary.findUnique({
    where: "id" in where ? { id: where.id } : { shareToken: where.shareToken },
    include: {
      city: { select: { id: true, name: true, lat: true, lng: true, country: { select: { name: true, isoCode: true, flag: true } } } },
      interests: true,
      items: { orderBy: [{ dayNumber: "asc" }, { position: "asc" }], include: { poi: { select: { category: true, osmId: true, priceTier: true } } } },
    },
  });
  if (!t) return null;
  const split = { stay: t.pctStay, food: t.pctFood, activities: t.pctActivities, transport: t.pctTransport };
  const items = t.items.map((i) => ({
    id: i.id, dayNumber: i.dayNumber, timeSlot: i.timeSlot, kind: i.kind, position: i.position, title: i.title, estimatedCost: num(i.estimatedCost) ?? 0,
    lat: i.lat, lng: i.lng, notes: i.notes, poiId: i.poiId, listingId: i.listingId, category: i.poi?.category ?? null, osmId: i.poi?.osmId ?? null,
  }));
  const budget = num(t.budget) ?? 0;
  return {
    id: t.id, userId: t.userId, title: t.title, days: t.days, people: t.peopleCount, rooms: t.roomsNeeded, budget, currency: t.currency, style: t.style,
    pace: t.pace, stayPreference: t.stayPreference, startDate: t.startDate ? t.startDate.toISOString().slice(0, 10) : null, shareToken: t.shareToken,
    minViableBudget: num(t.minViableBudget), interests: t.interests.map((i) => i.interest), split, city: t.city, items,
    meter: summarize(items.map((i) => ({ kind: i.kind, cost: i.estimatedCost })), budget, split),
  };
}

export type TripView = NonNullable<Awaited<ReturnType<typeof loadTrip>>>;
