import type { Interest, PoiCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError, notFound } from "@/lib/api";
import { getRate } from "@/lib/fx";
import { costRanges } from "@/lib/costs";
import { haversineKm } from "@/lib/geo";
import { midpoint } from "@/lib/poi/price-tier";
import { TRIP_FOOD, TRIP_RADIUS, TRIP_SIGHTS, TRIP_SIGHTS_CULTURE, TRIP_SIGHTS_OUTDOOR, TRIP_STAY } from "@/lib/poi/categories";
import { ensureCached, nearbyFromCache, withPrices } from "@/lib/poi/service";
import { normalizeSplit, DEFAULT_SPLIT, type Split } from "@/lib/budget";
import { num } from "@/lib/format";
import { plan, type Candidate, type PlanResult } from "@/lib/trip/planner";
import type { TripCreateInput } from "@/lib/validators/trip";

export const TRIP_RADIUS_M = TRIP_RADIUS.stay;

const INTEREST_CATEGORIES: Record<Interest, PoiCategory[]> = {
  CULTURE: ["MUSEUM", "GALLERY", "HISTORIC", "ATTRACTION"],
  FOOD: ["SHOPPING", "ATTRACTION"],
  NATURE: ["PARK", "VIEWPOINT"],
  NIGHTLIFE: ["NIGHTLIFE"],
  SHOPPING: ["SHOPPING"],
  ADVENTURE: ["VIEWPOINT", "PARK", "ATTRACTION"],
  FAMILY: ["PARK", "MUSEUM", "ATTRACTION"],
};

const STAY_FOR: Record<string, PoiCategory[]> = {
  ANY: TRIP_STAY,
  HOSTEL: ["HOSTEL", "CAMP_SITE"],
  HOTEL: ["HOTEL"],
  APARTMENT: ["GUEST_HOUSE"],
};

export type TripParams = {
  cityId: number; days: number; people: number; rooms: number; budget: number; currency: string; style: "BUDGET" | "BALANCED" | "COMFORT";
  pace: "RELAXED" | "NORMAL" | "PACKED"; stayPreference: "ANY" | "HOSTEL" | "HOTEL" | "APARTMENT"; interests: Interest[]; split: Split;
};

/** Loads (and if needed fetches) everything the planner needs for a city, priced in the trip currency. */
export async function buildPlan(p: TripParams): Promise<PlanResult & { localCurrency: string; rate: number }> {
  const city = await prisma.city.findUnique({ where: { id: p.cityId }, select: { id: true, name: true, lat: true, lng: true, countryId: true, country: { select: { currency: true } } } });
  if (!city) throw notFound("City not found.");
  if (city.lat === null || city.lng === null) throw new HttpError(422, "We don't have map coordinates for this city yet.");
  const center = { lat: city.lat, lng: city.lng };

  // One Overpass query per group, each with its own radius, so dense restaurant areas can't
  // crowd sights and stays out of the result limit.
  const groups: { categories: PoiCategory[]; radius: number }[] = [
    { categories: STAY_FOR[p.stayPreference]!, radius: TRIP_RADIUS.stay },
    { categories: TRIP_FOOD, radius: TRIP_RADIUS.food },
    { categories: TRIP_SIGHTS_CULTURE, radius: TRIP_RADIUS.sights },
    { categories: TRIP_SIGHTS_OUTDOOR, radius: TRIP_RADIUS.sights },
  ];
  let stale = false;
  const raw: Awaited<ReturnType<typeof nearbyFromCache>> = [];
  for (const g of groups) {
    const s = await ensureCached(center, g.radius, g.categories, city.id);
    stale ||= s.stale;
    raw.push(...(await nearbyFromCache(center, g.radius, g.categories, 80)));
  }
  const status = { stale };
  if (!raw.length && status.stale) throw new HttpError(503, "The map data service is busy and we have nothing cached for this city yet. Please try again in a minute.");
  const priced = await withPrices(raw, city.id, city.countryId);

  // all estimates for a country share one currency; convert once to the trip's currency
  const localCurrency = priced.find((x) => x.price)?.price?.currency ?? city.country.currency;
  const rate = (await getRate(localCurrency, p.currency)) ?? (localCurrency === p.currency ? 1 : null);
  if (rate === null) throw new HttpError(503, `We can't convert ${localCurrency} to ${p.currency} right now. Try planning in ${localCurrency}.`);
  const conv = (v: number) => Math.round(v * rate * 100) / 100;

  const toCand = (x: (typeof priced)[number]): Candidate => ({
    key: `poi:${x.id}`, poiId: x.id, title: x.name, category: x.category, lat: x.lat, lng: x.lng, tier: x.priceTier, unitPrice: conv(x.price?.mid ?? 0),
  });

  const stayCats = new Set(STAY_FOR[p.stayPreference]);
  const stays = priced.filter((x) => stayCats.has(x.category) && x.price).map(toCand);
  // short-stay listings from our own database (minimum stay of one month or less)
  if (p.stayPreference === "ANY" || p.stayPreference === "APARTMENT") {
    const listings = await prisma.listing.findMany({
      where: { cityId: city.id, status: "ACTIVE", minStayMonths: 1, lat: { not: null }, lng: { not: null } },
      select: { id: true, title: true, price: true, currency: true, lat: true, lng: true },
      take: 20,
    });
    for (const l of listings) {
      const r = (await getRate(l.currency, p.currency)) ?? null;
      if (r === null) continue;
      // monthly rent → per night with a 50 % short-stay premium
      stays.push({ key: `listing:${l.id}`, listingId: l.id, title: `${l.title} (Nira listing)`, category: "LISTING", lat: l.lat!, lng: l.lng!, tier: null, unitPrice: Math.round(((num(l.price) ?? 0) / 30) * 1.5 * r * 100) / 100 });
    }
  }

  const wanted = new Set<PoiCategory>(p.interests.length ? p.interests.flatMap((i) => INTEREST_CATEGORIES[i]) : TRIP_SIGHTS.filter((c) => c !== "NIGHTLIFE"));
  const sights = priced.filter((x) => wanted.has(x.category) && x.category !== "NIGHTLIFE").map(toCand);
  const evening = priced.filter((x) => (p.interests.includes("NIGHTLIFE") ? x.category === "NIGHTLIFE" : x.category === "VIEWPOINT")).map(toCand);
  const breakfasts = priced.filter((x) => (x.category === "CAFE" || x.category === "FAST_FOOD") && x.price).map(toCand);
  const meals = priced.filter((x) => (x.category === "RESTAURANT" || x.category === "FAST_FOOD" || x.category === "CAFE") && x.price).map(toCand);

  const [transportDay, stayRanges, mealRanges] = await Promise.all([
    costRanges(city.id, city.countryId, "TRANSPORT_DAY"),
    costRanges(city.id, city.countryId, "STAY_NIGHT"),
    costRanges(city.id, city.countryId, "MEAL"),
  ]);
  // No stays in the map cache (or the map service is down): plan with clearly-labelled
  // price estimates per tier instead of leaving the trip without a place to sleep.
  if (!stays.length && stayRanges.length) {
    const label: Record<number, string> = { 1: "Hostel or budget room", 2: "Guest house / simple hotel", 3: "Mid-range hotel", 4: "Comfort hotel" };
    for (const r of stayRanges) {
      stays.push({ key: `estimate:${r.tier}`, title: `${label[r.tier] ?? "Accommodation"} in ${city.name} (price estimate)`, category: "ESTIMATE", lat: center.lat, lng: center.lng, tier: r.tier, unitPrice: conv(midpoint(r)) });
    }
  }
  const transportPerPersonDay = transportDay[0] ? conv(midpoint(transportDay[0])) : null;
  const cheapestStay = Math.min(...stays.map((s) => s.unitPrice), stayRanges[0] ? conv(stayRanges[0].min) : Infinity);
  const cheapest = {
    roomNight: Number.isFinite(cheapestStay) ? cheapestStay : 0,
    meal: mealRanges[0] ? conv(mealRanges[0].min) : 0,
    transportDay: transportDay[0] ? conv(transportDay[0].min) : 0,
  };

  const result = plan({
    center, days: p.days, people: p.people, rooms: p.rooms, budget: p.budget, split: p.split, style: p.style, pace: p.pace,
    stays, breakfasts, meals, sights: sights.sort((a, b) => haversineKm(center, a) - haversineKm(center, b)), evening, transportPerPersonDay, cheapest,
  });
  if (status.stale) result.warnings.push("Live map data was unavailable, so this plan uses cached places.");
  return { ...result, localCurrency, rate };
}

export function paramsFromInput(input: TripCreateInput): TripParams {
  return {
    cityId: input.cityId, days: input.days, people: input.people, rooms: input.rooms ?? Math.max(1, Math.ceil(input.people / 2)), budget: input.budget,
    currency: input.currency, style: input.style, pace: input.pace, stayPreference: input.stayPreference, interests: input.interests,
    split: normalizeSplit(input.split ?? DEFAULT_SPLIT),
  };
}

export function itemsData(result: PlanResult): Omit<Prisma.ItineraryItemCreateManyInput, "itineraryId">[] {
  return result.items.map((i) => ({
    dayNumber: i.dayNumber, timeSlot: i.timeSlot, kind: i.kind, position: i.position, poiId: i.poiId ?? null, listingId: i.listingId ?? null,
    title: i.title.slice(0, 200), estimatedCost: i.estimatedCost, lat: i.lat ?? null, lng: i.lng ?? null, notes: i.notes?.slice(0, 300) ?? null,
  }));
}

/** Creates the itinerary, its interests and all items in one transaction. */
export async function createTrip(userId: number, input: TripCreateInput) {
  const params = paramsFromInput(input);
  const result = await buildPlan(params);
  const city = await prisma.city.findUniqueOrThrow({ where: { id: params.cityId }, select: { name: true } });
  const trip = await prisma.$transaction(async (tx) => {
    const it = await tx.itinerary.create({
      data: {
        userId, cityId: params.cityId, title: input.title || `${params.days} days in ${city.name}`, startDate: input.startDate ? new Date(input.startDate) : null,
        days: params.days, peopleCount: params.people, roomsNeeded: params.rooms, budget: params.budget, currency: params.currency, style: params.style,
        pace: params.pace, stayPreference: params.stayPreference, pctStay: params.split.stay, pctFood: params.split.food,
        pctActivities: params.split.activities, pctTransport: params.split.transport, minViableBudget: result.feasible ? null : result.minViableBudget,
      },
      select: { id: true },
    });
    if (params.interests.length) await tx.itineraryInterest.createMany({ data: params.interests.map((interest) => ({ itineraryId: it.id, interest })) });
    if (result.items.length) await tx.itineraryItem.createMany({ data: itemsData(result).map((d) => ({ ...d, itineraryId: it.id })) });
    return it;
  });
  return { id: trip.id, warnings: result.warnings, feasible: result.feasible };
}

/** Re-runs the generator with the saved parameters, replacing all items atomically. */
export async function regenerateTrip(tripId: number) {
  const t = await prisma.itinerary.findUniqueOrThrow({ where: { id: tripId }, include: { interests: true } });
  const params: TripParams = {
    cityId: t.cityId, days: t.days, people: t.peopleCount, rooms: t.roomsNeeded, budget: num(t.budget) ?? 0, currency: t.currency, style: t.style,
    pace: t.pace, stayPreference: t.stayPreference, interests: t.interests.map((i) => i.interest),
    split: { stay: t.pctStay, food: t.pctFood, activities: t.pctActivities, transport: t.pctTransport },
  };
  const result = await buildPlan(params);
  await prisma.$transaction([
    prisma.itineraryItem.deleteMany({ where: { itineraryId: tripId } }),
    prisma.itineraryItem.createMany({ data: itemsData(result).map((d) => ({ ...d, itineraryId: tripId })) }),
    prisma.itinerary.update({ where: { id: tripId }, data: { minViableBudget: result.feasible ? null : result.minViableBudget } }),
  ]);
  return { warnings: result.warnings, feasible: result.feasible };
}

/** Three alternatives in the same category group and price tier, near the original item. */
export async function alternativesFor(itemId: number, tripId: number) {
  const item = await prisma.itineraryItem.findFirst({ where: { id: itemId, itineraryId: tripId }, include: { poi: true, itinerary: { select: { cityId: true, currency: true, peopleCount: true, roomsNeeded: true, days: true, city: { select: { countryId: true, lat: true, lng: true } } } } } });
  if (!item || !item.poi) return [];
  const group = TRIP_STAY.includes(item.poi.category) ? TRIP_STAY : TRIP_FOOD.includes(item.poi.category) ? TRIP_FOOD : TRIP_SIGHTS;
  const near = { lat: item.poi.lat, lng: item.poi.lng };
  const usedIds = (await prisma.itineraryItem.findMany({ where: { itineraryId: tripId, poiId: { not: null } }, select: { poiId: true } })).map((r) => r.poiId!);
  const raw = await nearbyFromCache(near, TRIP_RADIUS_M, group, 30);
  const sameTier = raw.filter((r) => !usedIds.includes(r.id) && (item.poi!.priceTier === null || r.priceTier === item.poi!.priceTier));
  const priced = await withPrices(sameTier.slice(0, 3), item.itinerary.cityId, item.itinerary.city.countryId);
  const localCurrency = priced.find((p) => p.price)?.price?.currency ?? item.itinerary.currency;
  const rate = (await getRate(localCurrency, item.itinerary.currency)) ?? 1;
  const nights = Math.max(1, item.itinerary.days - 1);
  const factor = item.kind === "STAY" ? nights * item.itinerary.roomsNeeded : item.itinerary.peopleCount;
  return priced.map((p) => ({
    poiId: p.id, name: p.name, category: p.category, distanceKm: p.distanceKm, priceTier: p.priceTier,
    estimatedCost: Math.round((p.price?.mid ?? 0) * rate * factor * 100) / 100,
  }));
}
