import type { CostCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { num } from "@/lib/format";
import { FALLBACK_USD, type TierRange } from "@/lib/poi/price-tier";

/**
 * Cost estimates for a place: city rows first, then country rows, then a generic USD table.
 * Returns ranges per tier (tier 0 = untiered categories such as rent or transport).
 */
export async function costRanges(cityId: number | null, countryId: number | null, category: CostCategory): Promise<TierRange[]> {
  if (cityId) {
    const rows = await prisma.costEstimate.findMany({ where: { cityId, category }, orderBy: { tier: "asc" } });
    if (rows.length) return rows.map((r) => ({ tier: r.tier, min: num(r.minPrice) ?? 0, max: num(r.maxPrice) ?? 0, currency: r.currency }));
  }
  if (countryId) {
    const rows = await prisma.costEstimate.findMany({ where: { countryId, cityId: null, category }, orderBy: { tier: "asc" } });
    if (rows.length) return rows.map((r) => ({ tier: r.tier, min: num(r.minPrice) ?? 0, max: num(r.maxPrice) ?? 0, currency: r.currency }));
  }
  const fallback = FALLBACK_USD[category as keyof typeof FALLBACK_USD];
  if (fallback) return Object.entries(fallback).map(([tier, [min, max]]) => ({ tier: Number(tier), min, max, currency: "USD" }));
  return [];
}

export async function cityContext(cityId: number) {
  return prisma.city.findUnique({
    where: { id: cityId },
    select: { id: true, name: true, lat: true, lng: true, countryId: true, country: { select: { name: true, isoCode: true, currency: true } }, region: { select: { name: true } } },
  });
}

/** Cost-of-living snapshot rows (untiered + meal tiers) for the guide. */
export async function costSnapshot(cityId: number | null, countryId: number) {
  const where = cityId ? { cityId } : { countryId, cityId: null };
  let rows = await prisma.costEstimate.findMany({ where, orderBy: [{ category: "asc" }, { tier: "asc" }] });
  if (!rows.length && cityId) rows = await prisma.costEstimate.findMany({ where: { countryId, cityId: null }, orderBy: [{ category: "asc" }, { tier: "asc" }] });
  return rows.map((r) => ({ category: r.category, tier: r.tier, min: num(r.minPrice) ?? 0, max: num(r.maxPrice) ?? 0, currency: r.currency, source: r.source, updatedAt: r.updatedAt.toISOString() }));
}
