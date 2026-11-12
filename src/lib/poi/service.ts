import { Prisma, type PoiCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { areaKey, boundingBox } from "@/lib/geo";
import { derivePriceTier, isFree, midpoint, type TierRange } from "@/lib/poi/price-tier";
import { getProvider, type RawPoi } from "@/lib/poi/provider";
import { costRanges } from "@/lib/costs";

export const CACHE_DAYS = 7;
const MAX_AGE_MS = CACHE_DAYS * 86_400_000;

export type PoiResult = {
  id: number; osmId: string; name: string; category: PoiCategory; lat: number; lng: number; distanceKm: number;
  address: string | null; openingHours: string | null; cuisine: string | null; website: string | null; priceTier: number | null;
  free: boolean; price: { min: number; max: number; mid: number; currency: string } | null;
};

/** Bulk upsert with INSERT … ON DUPLICATE KEY UPDATE (one statement per 200 rows). */
async function upsertPois(rows: RawPoi[], cityId: number | null) {
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const values = chunk.map(
      (p) => Prisma.sql`(${p.osmId}, ${cityId}, ${p.category}, ${p.name}, ${p.address}, ${p.lat}, ${p.lng}, ${p.openingHours}, ${p.cuisine}, ${p.website}, ${derivePriceTier(p.category, p.tags)}, ${JSON.stringify(p.tags)}, NOW(3))`,
    );
    await prisma.$executeRaw`
      INSERT INTO POI (osmId, cityId, category, name, address, lat, lng, openingHours, cuisine, website, priceTier, tags, lastSyncedAt)
      VALUES ${Prisma.join(values)}
      ON DUPLICATE KEY UPDATE
        name = VALUES(name), category = VALUES(category), address = VALUES(address), lat = VALUES(lat), lng = VALUES(lng),
        openingHours = VALUES(openingHours), cuisine = VALUES(cuisine), website = VALUES(website), priceTier = VALUES(priceTier),
        tags = VALUES(tags), lastSyncedAt = VALUES(lastSyncedAt), cityId = COALESCE(cityId, VALUES(cityId))`;
  }
}

/**
 * Makes sure the cache covers (center, radius, categories), fetching only the categories
 * that are missing or older than 7 days. If the provider is down we keep serving the
 * stale cache and say so.
 */
export async function ensureCached(center: { lat: number; lng: number }, radiusM: number, categories: PoiCategory[], cityId: number | null) {
  const key = areaKey(center, radiusM);
  const cached = await prisma.poiQueryCache.findMany({ where: { areaKey: key, category: { in: categories } } });
  const fresh = new Set(cached.filter((c) => Date.now() - c.fetchedAt.getTime() < MAX_AGE_MS).map((c) => c.category));
  const missing = categories.filter((c) => !fresh.has(c));
  if (!missing.length) return { stale: false, fetched: 0 };

  try {
    const provider = await getProvider();
    const rows = await provider.search(center, radiusM, missing);
    await upsertPois(rows, cityId);
    const counts = new Map<PoiCategory, number>();
    for (const r of rows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    await prisma.$transaction(
      missing.map((category) =>
        prisma.poiQueryCache.upsert({
          where: { areaKey_category: { areaKey: key, category } },
          update: { fetchedAt: new Date(), resultCount: counts.get(category) ?? 0 },
          create: { areaKey: key, category, fetchedAt: new Date(), resultCount: counts.get(category) ?? 0 },
        }),
      ),
    );
    return { stale: false, fetched: rows.length };
  } catch (err) {
    console.warn("[poi] provider failed, serving cache:", (err as Error).message);
    return { stale: true, fetched: 0 };
  }
}

/** Reads cached places around a point: bounding box (indexed) then exact Haversine in SQL. */
export async function nearbyFromCache(center: { lat: number; lng: number }, radiusM: number, categories: PoiCategory[], limitPerCategory = 40) {
  const box = boundingBox(center, radiusM / 1000);
  const rows = await prisma.$queryRaw<(Omit<PoiResult, "free" | "price"> & { tags: unknown })[]>`
    SELECT * FROM (
      SELECT p.id, p.osmId, p.name, p.category, p.lat, p.lng, p.address, p.openingHours, p.cuisine, p.website, p.priceTier, p.tags,
             fn_distance_km(${center.lat}, ${center.lng}, p.lat, p.lng) AS distanceKm,
             ROW_NUMBER() OVER (PARTITION BY p.category ORDER BY fn_distance_km(${center.lat}, ${center.lng}, p.lat, p.lng)) AS rn
      FROM POI p
      WHERE p.category IN (${Prisma.join(categories)})
        AND p.lat BETWEEN ${box.minLat} AND ${box.maxLat}
        AND p.lng BETWEEN ${box.minLng} AND ${box.maxLng}
    ) ranked
    WHERE ranked.distanceKm <= ${radiusM / 1000} AND ranked.rn <= ${limitPerCategory}
    ORDER BY ranked.distanceKm`;
  return rows.map((r) => ({ ...r, distanceKm: Number(r.distanceKm), tags: (typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags ?? {}) as Record<string, string> }));
}

const PRICED: Partial<Record<PoiCategory, "MEAL" | "STAY_NIGHT" | "ATTRACTION_ENTRY">> = {
  RESTAURANT: "MEAL", CAFE: "MEAL", FAST_FOOD: "MEAL", NIGHTLIFE: "MEAL",
  HOTEL: "STAY_NIGHT", HOSTEL: "STAY_NIGHT", GUEST_HOUSE: "STAY_NIGHT", CAMP_SITE: "STAY_NIGHT",
  ATTRACTION: "ATTRACTION_ENTRY", MUSEUM: "ATTRACTION_ENTRY", GALLERY: "ATTRACTION_ENTRY", HISTORIC: "ATTRACTION_ENTRY",
  VIEWPOINT: "ATTRACTION_ENTRY", PARK: "ATTRACTION_ENTRY", SHOPPING: "ATTRACTION_ENTRY",
};

/** Attaches an estimated price range to each priced place using CostEstimate tiers. */
export async function withPrices<T extends { category: PoiCategory; priceTier: number | null; tags?: Record<string, string> }>(items: T[], cityId: number | null, countryId: number | null) {
  const needed = new Set(items.map((i) => PRICED[i.category]).filter(Boolean) as ("MEAL" | "STAY_NIGHT" | "ATTRACTION_ENTRY")[]);
  const ranges = new Map<string, TierRange[]>();
  for (const cat of needed) ranges.set(cat, await costRanges(cityId, countryId, cat));
  return items.map((i) => {
    const cat = PRICED[i.category];
    const free = cat === "ATTRACTION_ENTRY" && isFree(i.category, i.tags ?? {});
    const tier = i.priceTier ?? null;
    const r = cat && tier ? ranges.get(cat)?.find((x) => x.tier === tier) : undefined;
    const price = free ? { min: 0, max: 0, mid: 0, currency: r?.currency ?? "USD" } : r ? { min: r.min, max: r.max, mid: midpoint(r), currency: r.currency } : null;
    return { ...i, free, price };
  });
}

export async function nearby(opts: { center: { lat: number; lng: number }; radiusM: number; categories: PoiCategory[]; cityId: number | null; countryId: number | null }) {
  const status = await ensureCached(opts.center, opts.radiusM, opts.categories, opts.cityId);
  const raw = await nearbyFromCache(opts.center, opts.radiusM, opts.categories);
  const items = await withPrices(raw, opts.cityId, opts.countryId);
  return { items: items.map(({ tags: _tags, ...rest }) => rest) as PoiResult[], stale: status.stale };
}
