import { prisma } from "@/lib/prisma";
import { num } from "@/lib/format";
import { boundingBox } from "@/lib/geo";
import { costRanges } from "@/lib/costs";
import { midpoint } from "@/lib/poi/price-tier";

type NearRow = { id: number; name: string; lat: number; lng: number; regionName: string | null; countryId: number; km: number; known: number | bigint };

/** A suburb this close to a city Nira has real data for is reported as that city. */
const METRO_RADIUS_KM = 20;

/**
 * Nearest city to a GPS position. Uses the City(lat, lng) index with a bounding box that
 * widens (25 km → 100 km → 400 km) until something is found, then ranks the candidates
 * with the stored function fn_distance_km. No external reverse-geocoding service needed.
 *
 * City datasets list every suburb ("Donnybrook", "Koramangala"), so standing on a campus in
 * Dublin the literal nearest row is a suburb with no guide photo, prices or homes. A city Nira
 * knows (it has a photo, i.e. it is a seeded destination) within METRO_RADIUS_KM wins instead.
 */
export async function nearestCity(lat: number, lng: number) {
  for (const radiusKm of [25, 100, 400]) {
    const b = boundingBox({ lat, lng }, radiusKm);
    const rows = await prisma.$queryRaw<NearRow[]>`
      SELECT c.id, c.name, c.lat, c.lng, r.name AS regionName, c.countryId,
             fn_distance_km(${lat}, ${lng}, c.lat, c.lng) AS km, (c.photoUrl IS NOT NULL) AS known
      FROM City c LEFT JOIN Region r ON r.id = c.regionId
      WHERE c.lat BETWEEN ${b.minLat} AND ${b.maxLat} AND c.lng BETWEEN ${b.minLng} AND ${b.maxLng}
      ORDER BY known DESC, km
      LIMIT 12`;
    if (rows[0]) {
      const cands = rows.map(({ known, ...r }) => ({ ...r, km: Number(r.km), known: Number(known) === 1 })).sort((x, y) => x.km - y.km);
      const metro = cands.find((r) => r.known && r.km <= METRO_RADIUS_KM);
      // datasets also list districts like "Zürich (Kreis 1)"; prefer a plain city name within 10 km
      const plain = cands.find((r) => !r.name.includes("(") && r.km <= cands[0]!.km + 10) ?? cands[0]!;
      const { known: _known, ...city } = metro ?? plain;
      void _known;
      return city;
    }
  }
  return null;
}

/** Everything a newcomer needs right where they are: guide, SIMs, rides, emergency, costs, homes. */
export async function localBriefing(lat: number, lng: number, homeCountryId: number | null = null) {
  const city = await nearestCity(lat, lng);
  if (!city) return null;
  return briefingForCity(city, { lat, lng }, homeCountryId);
}

type BriefingCity = { id: number; name: string; lat: number; lng: number; regionName: string | null; countryId: number; km: number };

/**
 * The same briefing for a known city (e.g. the destination on someone's profile). `position`
 * is the point "nearby" things are measured from: a GPS fix, a campus, or the city centre.
 */
export async function briefingForCity(city: BriefingCity, position: { lat: number; lng: number }, homeCountryId: number | null = null) {
  const { lat, lng } = position;
  const country = await prisma.country.findUniqueOrThrow({ where: { id: city.countryId }, select: { id: true, name: true, isoCode: true, flag: true, currency: true, photoUrl: true, photoCredit: true } });
  const cityPhoto = await prisma.city.findUnique({ where: { id: city.id }, select: { photoUrl: true, photoCredit: true } });
  const box = boundingBox({ lat, lng }, 15);

  const [articles, checklist, emergency, sims, rides, listings, meal, transportDay, home, modes, passes, banks, rentShared, groceries, transportMonth] = await Promise.all([
    prisma.guideArticle.count({ where: { countryId: country.id } }),
    prisma.checklistTemplate.count({ where: { countryId: country.id } }),
    prisma.emergencyNumber.findMany({ where: { countryId: country.id }, select: { service: true, number: true }, take: 4 }),
    prisma.simProvider.findMany({
      where: { countryId: country.id },
      orderBy: [{ isMvno: "desc" }, { name: "asc" }],
      take: 6,
      select: { name: true, isMvno: true, whereToBuy: true, plans: { orderBy: { priceMonthly: "asc" }, take: 1, select: { name: true, priceMonthly: true, currency: true, kind: true } } },
    }),
    prisma.rideService.findMany({ where: { countryId: country.id }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { name: true, kind: true, website: true, deepLink: true, phone: true, notes: true } }),
    prisma.listing.count({ where: { status: "ACTIVE", lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } } }),
    costRanges(city.id, country.id, "MEAL"),
    costRanges(city.id, country.id, "TRANSPORT_DAY"),
    homeCountryId ? prisma.country.findUnique({ where: { id: homeCountryId }, select: { name: true, flag: true, currency: true } }) : null,
    prisma.transportMode.findMany({ where: { countryId: country.id }, orderBy: { position: "asc" }, take: 5, select: { mode: true, title: true, priceRange: true, howToBuy: true, apps: true } }),
    prisma.transportPass.findMany({ where: { countryId: country.id, OR: [{ cityId: null }, { cityId: city.id }] }, orderBy: { id: "asc" }, take: 4, select: { name: true, price: true, currency: true, validity: true, audience: true, url: true } }),
    prisma.bank.findMany({ where: { countryId: country.id }, orderBy: { id: "asc" }, take: 5, select: { name: true, kind: true, studentAccount: true } }),
    costRanges(city.id, country.id, "RENT_SHARED_ROOM"),
    costRanges(city.id, country.id, "GROCERIES_MONTH"),
    costRanges(city.id, country.id, "TRANSPORT_MONTH"),
  ]);
  // only quote a cost when it is real data for this country, not the generic USD fallback
  const local = (r: { min: number; max: number; currency: string } | undefined) => (r && r.currency === country.currency ? { min: r.min, max: r.max, currency: r.currency } : null);

  return {
    position: { lat, lng },
    city: { id: city.id, name: city.name, region: city.regionName, lat: city.lat, lng: city.lng, distanceKm: Math.round(city.km * 10) / 10 },
    photo: cityPhoto?.photoUrl ? { url: cityPhoto.photoUrl, credit: cityPhoto.photoCredit } : country.photoUrl ? { url: country.photoUrl, credit: country.photoCredit } : null,
    country,
    home,
    guide: { articles, checklist },
    emergency,
    sims: sims.map((s) => ({ name: s.name, isMvno: s.isMvno, whereToBuy: s.whereToBuy, cheapest: s.plans[0] ? { name: s.plans[0].name, price: num(s.plans[0].priceMonthly), currency: s.plans[0].currency, kind: s.plans[0].kind } : null })),
    rides,
    transport: modes,
    passes: passes.map((p) => ({ ...p, price: num(p.price) })),
    banks,
    listingsNearby: listings,
    costs: {
      cheapMeal: meal.find((m) => m.tier === 1) ? { ...meal.find((m) => m.tier === 1)!, mid: midpoint(meal.find((m) => m.tier === 1)!) } : null,
      transportDay: transportDay[0] ? { ...transportDay[0], mid: midpoint(transportDay[0]) } : null,
      rentSharedRoom: local(rentShared[0]),
      groceriesMonth: local(groceries[0]),
      transportMonth: local(transportMonth[0]),
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
