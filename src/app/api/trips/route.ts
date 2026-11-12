import { prisma } from "@/lib/prisma";
import { enforceRateLimit, json, readJson, requireUser, route } from "@/lib/api";
import { tripCreateSchema } from "@/lib/validators/trip";
import { createTrip } from "@/lib/trip/generate";
import { num } from "@/lib/format";

export const GET = route(async () => {
  const user = await requireUser(["USER", "ADMIN"]);
  // aggregate: planned spend per trip (JOIN + GROUP BY in one query)
  const trips = await prisma.itinerary.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, days: true, peopleCount: true, budget: true, currency: true, startDate: true, createdAt: true, city: { select: { name: true, country: { select: { name: true, flag: true } } } } },
  });
  const spend = await prisma.itineraryItem.groupBy({ by: ["itineraryId"], where: { itineraryId: { in: trips.map((t) => t.id) } }, _sum: { estimatedCost: true }, _count: true });
  const byId = new Map(spend.map((s) => [s.itineraryId, s]));
  return json({
    items: trips.map((t) => ({ ...t, budget: num(t.budget), planned: num(byId.get(t.id)?._sum.estimatedCost ?? 0), stops: byId.get(t.id)?._count ?? 0 })),
  });
});

/** Generates and saves a new itinerary. Can take a while the first time a city is planned. */
export const POST = route(async (req) => {
  const user = await requireUser(["USER", "ADMIN"]);
  enforceRateLimit(`trip:${user.id}`, 10, 10 * 60_000);
  const input = await readJson(req, tripCreateSchema);
  const trip = await createTrip(user.id, input);
  return json(trip, 201);
});
