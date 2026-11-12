import { prisma } from "@/lib/prisma";
import { num } from "@/lib/format";
import { boundingBox } from "@/lib/geo";
import { costRanges } from "@/lib/costs";
import { midpoint } from "@/lib/poi/price-tier";

type NearRow = { id: number; name: string; lat: number; lng: number; regionName: string | null; countryId: number; km: number };

/**
 * Nearest city to a GPS position. Uses the City(lat, lng) index with a bounding box that
 * widens (25 km → 100 km → 400 km) until something is found, then ranks the candidates
 * with the stored function fn_distance_km. No external reverse-geocoding service needed.
 */
export async function nearestCity(lat: number, lng: number) {
  for (const radiusKm of [25, 100, 400]) {
    const b = boundingBox({ lat, lng }, radiusKm);
    const rows = await prisma.$queryRaw<NearRow[]>`
      SELECT c.id, c.name, c.lat, c.lng, r.name AS regionName, c.countryId, fn_distance_km(${lat}, ${lng}, c.lat, c.lng) AS km
      FROM City c LEFT JOIN Region r ON r.id = c.regionId
      WHERE c.lat BETWEEN ${b.minLat} AND ${b.maxLat} AND c.lng BETWEEN ${b.minLng} AND ${b.maxLng}
      ORDER BY km
      LIMIT 10`;
    if (rows[0]) {
      // datasets list districts like "Zürich (Kreis 1)"; prefer a plain city name within 10 km
      const nearest = Number(rows[0].km);
      const plain = rows.find((r) => !r.name.includes("(") && Number(r.km) <= nearest + 10) ?? rows[0];
      return { ...plain, km: Number(plain.km) };
    }
  }
  return null;
}

/** Everything a newcomer needs right where they are: guide, SIMs, rides, emergency, costs, homes. */
export async function localBriefing(lat: number, lng: number, homeCountryId: number | null = null) {
  const city = await nearestCity(lat, lng);
  if (!city) return null;
  const country = await prisma.country.findUniqueOrThrow({ where: { id: city.countryId }, select: { id: true, name: true, isoCode: true, flag: true, currency: true } });
  const box = boundingBox({ lat, lng }, 15);

  const [articles, checklist, emergency, sims, rides, listings, meal, transportDay, home] = await Promise.all([
    prisma.guideArticle.count({ where: { countryId: country.id } }),
    prisma.checklistTemplate.count({ where: { countryId: country.id } }),
    prisma.emergencyNumber.findMany({ where: { countryId: country.id }, select: { service: true, number: true }, take: 4 }),
    prisma.simProvider.findMany({
      where: { countryId: country.id },
      orderBy: [{ isMvno: "desc" }, { name: "asc" }],
      take: 3,
      select: { name: true, isMvno: true, whereToBuy: true, plans: { orderBy: { priceMonthly: "asc" }, take: 1, select: { name: true, priceMonthly: true, currency: true, kind: true } } },
    }),
    prisma.rideService.findMany({ where: { countryId: country.id }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { name: true, kind: true, website: true, deepLink: true, phone: true, notes: true } }),
    prisma.listing.count({ where: { status: "ACTIVE", lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } } }),
    costRanges(city.id, country.id, "MEAL"),
    costRanges(city.id, country.id, "TRANSPORT_DAY"),
    homeCountryId ? prisma.country.findUnique({ where: { id: homeCountryId }, select: { name: true, flag: true, currency: true } }) : null,
  ]);

  return {
    position: { lat, lng },
    city: { id: city.id, name: city.name, region: city.regionName, lat: city.lat, lng: city.lng, distanceKm: Math.round(city.km * 10) / 10 },
    country,
    home,
    guide: { articles, checklist },
    emergency,
    sims: sims.map((s) => ({ name: s.name, isMvno: s.isMvno, whereToBuy: s.whereToBuy, cheapest: s.plans[0] ? { name: s.plans[0].name, price: num(s.plans[0].priceMonthly), currency: s.plans[0].currency, kind: s.plans[0].kind } : null })),
    rides,
    listingsNearby: listings,
    costs: {
      cheapMeal: meal.find((m) => m.tier === 1) ? { ...meal.find((m) => m.tier === 1)!, mid: midpoint(meal.find((m) => m.tier === 1)!) } : null,
      transportDay: transportDay[0] ? { ...transportDay[0], mid: midpoint(transportDay[0]) } : null,
    },
  };
}

export type LocalBriefing = NonNullable<Awaited<ReturnType<typeof localBriefing>>>;

/** Fills a ride deep-link template; values are URL-encoded so names can't break the link. */
export function rideLink(template: string, dest: { lat: number; lng: number; name: string }) {
  return template
    .replaceAll("{lat}", encodeURIComponent(dest.lat.toFixed(6)))
    .replaceAll("{lng}", encodeURIComponent(dest.lng.toFixed(6)))
    .replaceAll("{name}", encodeURIComponent(dest.name));
}
