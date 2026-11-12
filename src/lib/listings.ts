import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { num } from "@/lib/format";
import type { ListingSearch } from "@/lib/validators/listing";

export const PAGE_SIZE = 12;

export type ListingCardData = {
  id: number;
  title: string;
  type: string;
  status: string;
  price: number;
  currency: string;
  cityName: string;
  regionName: string | null;
  countryName: string;
  countryCode: string;
  coverUrl: string | null;
  photoCount: number;
  isShareable: boolean;
  spotsLeft: number;
  capacityMax: number;
  genderPreference: string;
  bedrooms: number;
  furnished: boolean;
  availableFrom: string | null;
  lat: number | null;
  lng: number | null;
  ownerName: string;
  ownerVerified: boolean;
  openRequests: number;
  distanceKm: number | null;
  saved?: boolean;
};

type Row = {
  id: number; title: string; type: string; status: string; price: Prisma.Decimal; currency: string; cityName: string; regionName: string | null;
  countryName: string; countryCode: string; coverUrl: string | null; photoCount: bigint; isShareable: number | boolean; spotsLeft: number;
  capacityMax: number; genderPreference: string; bedrooms: number; furnished: number | boolean; availableFrom: Date | null; lat: number | null;
  lng: number | null; ownerName: string; ownerVerified: number | boolean; openRequests: bigint; distanceKm: number | null; totalCount?: bigint;
};

export function mapRow(r: Row): ListingCardData {
  return {
    id: r.id, title: r.title, type: r.type, status: r.status, price: num(r.price) ?? 0, currency: r.currency, cityName: r.cityName,
    regionName: r.regionName, countryName: r.countryName, countryCode: r.countryCode, coverUrl: r.coverUrl, photoCount: Number(r.photoCount),
    isShareable: Boolean(r.isShareable), spotsLeft: Number(r.spotsLeft), capacityMax: r.capacityMax, genderPreference: r.genderPreference,
    bedrooms: r.bedrooms, furnished: Boolean(r.furnished), availableFrom: r.availableFrom ? r.availableFrom.toISOString().slice(0, 10) : null,
    lat: r.lat, lng: r.lng, ownerName: r.ownerName, ownerVerified: Boolean(r.ownerVerified), openRequests: Number(r.openRequests),
    distanceKm: r.distanceKm === null ? null : Number(r.distanceKm),
  };
}

/** Turns "sunny room near eth" into a boolean FULLTEXT query: +sunny* +room* +near* +eth* */
export function toBooleanQuery(q: string) {
  const words = q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 8);
  return words.length ? words.map((w) => `+${w}*`).join(" ") : null;
}

/**
 * Server-side paginated search over the v_listing_summary view.
 * Demonstrates: VIEW, FULLTEXT (MATCH … AGAINST), correlated sub-query with COUNT for
 * "has all amenities", the fn_distance_km stored function, and a window function
 * COUNT(*) OVER () that returns the total in the same round-trip.
 */
export async function searchListings(f: ListingSearch, opts: { center?: { lat: number; lng: number } | null } = {}) {
  const where: Prisma.Sql[] = [Prisma.sql`v.status = 'ACTIVE'`];
  if (f.countryId) where.push(Prisma.sql`v.countryId = ${f.countryId}`);
  if (f.regionId) where.push(Prisma.sql`v.regionId = ${f.regionId}`);
  if (f.cityId) where.push(Prisma.sql`v.cityId = ${f.cityId}`);
  if (f.type) where.push(Prisma.sql`v.type = ${f.type}`);
  if (f.minPrice !== undefined) where.push(Prisma.sql`v.price >= ${f.minPrice}`);
  if (f.maxPrice !== undefined) where.push(Prisma.sql`v.price <= ${f.maxPrice}`);
  if (f.shareable) where.push(Prisma.sql`v.isShareable = TRUE`);
  if (f.openSpots) where.push(Prisma.sql`v.isShareable = TRUE AND v.spotsLeft > 0`);
  if (f.furnished) where.push(Prisma.sql`v.furnished = TRUE`);
  if (f.gender) where.push(f.gender === "ANYONE" ? Prisma.sql`v.genderPreference = 'ANYONE'` : Prisma.sql`v.genderPreference IN (${f.gender}, 'ANYONE')`);
  if (f.availableBy) where.push(Prisma.sql`(v.availableFrom IS NULL OR v.availableFrom <= ${f.availableBy})`);
  if (f.bedrooms !== undefined) where.push(Prisma.sql`v.bedrooms >= ${f.bedrooms}`);
  if (f.amenities.length) {
    where.push(Prisma.sql`(SELECT COUNT(*) FROM ListingAmenity la WHERE la.listingId = v.id AND la.amenityId IN (${Prisma.join(f.amenities)})) = ${f.amenities.length}`);
  }
  if (f.q) {
    const bq = toBooleanQuery(f.q);
    if (bq) where.push(Prisma.sql`v.id IN (SELECT l.id FROM Listing l WHERE MATCH(l.title, l.description) AGAINST (${bq} IN BOOLEAN MODE))`);
    else where.push(Prisma.sql`v.title LIKE ${"%" + f.q + "%"}`);
  }

  const center = f.lat !== undefined && f.lng !== undefined ? { lat: f.lat, lng: f.lng } : opts.center ?? null;
  const distance = center ? Prisma.sql`fn_distance_km(${center.lat}, ${center.lng}, v.lat, v.lng)` : Prisma.sql`NULL`;
  const orderBy =
    f.sort === "price_asc" ? Prisma.sql`v.price ASC, v.id DESC`
    : f.sort === "price_desc" ? Prisma.sql`v.price DESC, v.id DESC`
    : f.sort === "nearest" && center ? Prisma.sql`distanceKm IS NULL, distanceKm ASC`
    : Prisma.sql`v.createdAt DESC, v.id DESC`;

  const offset = (f.page - 1) * PAGE_SIZE;
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT v.*, ${distance} AS distanceKm, COUNT(*) OVER () AS totalCount
    FROM v_listing_summary v
    WHERE ${Prisma.join(where, " AND ")}
    ORDER BY ${orderBy}
    LIMIT ${PAGE_SIZE} OFFSET ${offset}`;

  const total = rows.length ? Number(rows[0]!.totalCount) : 0;
  return { items: rows.map(mapRow), total, page: f.page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), pageSize: PAGE_SIZE };
}

/** Cards for a set of ids (saved, recently viewed, owner's listings) in the given order. */
export async function cardsByIds(ids: number[]) {
  if (!ids.length) return [];
  const rows = await prisma.$queryRaw<Row[]>`SELECT v.*, NULL AS distanceKm FROM v_listing_summary v WHERE v.id IN (${Prisma.join(ids)})`;
  const byId = new Map(rows.map((r) => [r.id, mapRow(r)]));
  return ids.map((id) => byId.get(id)).filter((x): x is ListingCardData => Boolean(x));
}

export async function savedIdsFor(userId: number | null | undefined, ids: number[]) {
  if (!userId || !ids.length) return new Set<number>();
  const rows = await prisma.savedListing.findMany({ where: { userId, listingId: { in: ids } }, select: { listingId: true } });
  return new Set(rows.map((r) => r.listingId));
}

/** Where this listing's price sits among active listings in its city (window function). */
export async function priceRankInCity(listingId: number) {
  const rows = await prisma.$queryRaw<{ pct: number; cityCount: bigint; cityAvg: Prisma.Decimal }[]>`
    SELECT ranked.pct, ranked.cityCount, ranked.cityAvg FROM (
      SELECT l.id,
             PERCENT_RANK() OVER (PARTITION BY l.cityId ORDER BY l.price) AS pct,
             COUNT(*)       OVER (PARTITION BY l.cityId)                   AS cityCount,
             AVG(l.price)   OVER (PARTITION BY l.cityId)                   AS cityAvg
      FROM Listing l
      WHERE l.status = 'ACTIVE' AND l.cityId = (SELECT cityId FROM Listing WHERE id = ${listingId})
    ) ranked
    WHERE ranked.id = ${listingId}`;
  const r = rows[0];
  if (!r) return null;
  return { percentile: Math.round(Number(r.pct) * 100), cityCount: Number(r.cityCount), cityAvg: num(r.cityAvg) ?? 0 };
}

/** Records one unique view per visitor per day; duplicates are ignored by the UNIQUE key. */
export async function recordView(listingId: number, viewerId: number | null, viewerKey: string) {
  const today = new Date(new Date().toISOString().slice(0, 10));
  await prisma.listingView.createMany({ data: [{ listingId, viewerId, viewerKey, viewedOn: today }], skipDuplicates: true });
}
