import type { CostCategory, PrismaClient } from "@prisma/client";
import { findCity } from "./locations";

/**
 * Indicative cost-of-living data. Base values are for Zurich in CHF; other Swiss cities
 * use a price index. Other countries get country-level rows (cityId NULL) derived from
 * a USD base, a price level and an approximate exchange rate. Sources are noted per row.
 */
type Range = [number, number];
type Table = Partial<Record<CostCategory, Range | Record<number, Range>>>;

const ZURICH: Table = {
  RENT_SHARED_ROOM: [800, 1250],
  RENT_STUDIO: [1300, 1950],
  RENT_ONE_BEDROOM: [1800, 2700],
  GROCERIES_MONTH: [380, 600],
  TRANSPORT_MONTH: [85, 100],
  TRANSPORT_DAY: [8.8, 14],
  PHONE_MONTH: [20, 60],
  COFFEE: [4.5, 6.5],
  MEAL: { 1: [14, 22], 2: [25, 40], 3: [45, 75], 4: [90, 180] },
  STAY_NIGHT: { 1: [90, 140], 2: [140, 210], 3: [210, 330], 4: [350, 700] },
  ATTRACTION_ENTRY: { 1: [0, 12], 2: [12, 25], 3: [25, 45], 4: [45, 110] },
};

const SWISS_CITIES: { name: string; index: number }[] = [
  { name: "Zürich", index: 1.0 },
  { name: "Genève", index: 1.0 },
  { name: "Zug", index: 1.04 },
  { name: "Basel", index: 0.9 },
  { name: "Lausanne", index: 0.93 },
  { name: "Bern", index: 0.86 },
  { name: "Luzern", index: 0.88 },
  { name: "Lugano", index: 0.83 },
  { name: "Sankt Gallen", index: 0.79 },
  { name: "Fribourg", index: 0.76 },
];

// USD base for a mid-priced western city
const USD_BASE: Table = {
  RENT_SHARED_ROOM: [600, 950],
  RENT_STUDIO: [1000, 1500],
  RENT_ONE_BEDROOM: [1300, 2000],
  GROCERIES_MONTH: [280, 450],
  TRANSPORT_MONTH: [60, 100],
  TRANSPORT_DAY: [6, 10],
  PHONE_MONTH: [15, 45],
  COFFEE: [3, 5],
  MEAL: { 1: [8, 14], 2: [15, 28], 3: [30, 55], 4: [60, 140] },
  STAY_NIGHT: { 1: [45, 80], 2: [80, 140], 3: [140, 240], 4: [250, 550] },
  ATTRACTION_ENTRY: { 1: [0, 8], 2: [8, 18], 3: [18, 35], 4: [35, 80] },
};

/** price level vs. the USD base, and approximate units of local currency per USD */
const COUNTRIES: { iso: string; currency: string; level: number; fx: number }[] = [
  { iso: "DE", currency: "EUR", level: 0.85, fx: 0.92 },
  { iso: "FR", currency: "EUR", level: 0.92, fx: 0.92 },
  { iso: "NL", currency: "EUR", level: 0.97, fx: 0.92 },
  { iso: "IT", currency: "EUR", level: 0.8, fx: 0.92 },
  { iso: "ES", currency: "EUR", level: 0.72, fx: 0.92 },
  { iso: "AT", currency: "EUR", level: 0.88, fx: 0.92 },
  { iso: "GB", currency: "GBP", level: 1.02, fx: 0.79 },
  { iso: "US", currency: "USD", level: 1.05, fx: 1 },
  { iso: "CA", currency: "CAD", level: 0.92, fx: 1.37 },
  { iso: "AU", currency: "AUD", level: 0.95, fx: 1.52 },
  { iso: "JP", currency: "JPY", level: 0.72, fx: 150 },
  { iso: "IN", currency: "INR", level: 0.24, fx: 84 },
];

const round = (n: number, currency: string) => (currency === "JPY" || currency === "INR" ? Math.round(n / 10) * 10 : Math.round(n * 2) / 2);

function* rows(table: Table, factor: number, currency: string) {
  for (const [category, value] of Object.entries(table) as [CostCategory, Range | Record<number, Range>][]) {
    if (Array.isArray(value)) {
      yield { category, tier: 0, min: round(value[0] * factor, currency), max: round(value[1] * factor, currency) };
    } else {
      for (const [tier, r] of Object.entries(value)) {
        yield { category, tier: Number(tier), min: round(r[0] * factor, currency), max: round(r[1] * factor, currency) };
      }
    }
  }
}

async function upsertCost(prisma: PrismaClient, countryId: number, cityId: number | null, r: { category: CostCategory; tier: number; min: number; max: number }, currency: string, source: string) {
  // findFirst + update/create because the unique key contains a nullable column (cityId)
  const existing = await prisma.costEstimate.findFirst({ where: { countryId, cityId, category: r.category, tier: r.tier }, select: { id: true } });
  const data = { minPrice: r.min, maxPrice: Math.max(r.min, r.max), currency, source };
  if (existing) await prisma.costEstimate.update({ where: { id: existing.id }, data });
  else await prisma.costEstimate.create({ data: { ...data, countryId, cityId, category: r.category, tier: r.tier } });
}

export async function seedCosts(prisma: PrismaClient) {
  let count = 0;
  const ch = await prisma.country.findUniqueOrThrow({ where: { isoCode: "CH" }, select: { id: true } });
  for (const c of SWISS_CITIES) {
    const city = await findCity(prisma, "CH", c.name);
    for (const r of rows(ZURICH, c.index, "CHF")) {
      await upsertCost(prisma, ch.id, city.id, r, "CHF", "Nira estimate from comparis.ch, Numbeo and operator price lists (2025)");
      count++;
    }
  }
  // country-wide Swiss fallback for every other Swiss town
  for (const r of rows(ZURICH, 0.82, "CHF")) {
    await upsertCost(prisma, ch.id, null, r, "CHF", "Nira Swiss average estimate");
    count++;
  }
  for (const c of COUNTRIES) {
    const country = await prisma.country.findUnique({ where: { isoCode: c.iso }, select: { id: true } });
    if (!country) continue;
    for (const r of rows(USD_BASE, c.level * c.fx, c.currency)) {
      await upsertCost(prisma, country.id, null, r, c.currency, "Nira country-level estimate (price index × exchange rate)");
      count++;
    }
  }
  console.log(`  cost estimates: ${count}`);
}
