/**
 * OpenStreetMap carries no prices, so we derive a price tier (1 cheap … 4 expensive)
 * from the feature type and tags, then turn the tier into an approximate price range
 * with the CostEstimate table (country/city specific). Always shown as an *estimate*.
 */
import type { PoiCategory } from "@prisma/client";

export type Tags = Record<string, string | undefined>;

const CHEAP_CUISINES = ["kebab", "pizza", "burger", "sandwich", "noodle", "falafel", "street_food", "fish_and_chips", "doner", "bakery", "chicken", "hot_dog", "taco"];
const PRICEY_CUISINES = ["fine_dining", "french", "steak_house", "sushi", "seafood", "fondue", "molecular", "gourmet"];

const clamp = (n: number) => Math.max(1, Math.min(4, n));

function cuisineList(tags: Tags) {
  return (tags.cuisine ?? "")
    .toLowerCase()
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Returns 1-4 for places where price matters, or null (supermarkets, hospitals …). */
export function derivePriceTier(category: PoiCategory, tags: Tags = {}): number | null {
  switch (category) {
    case "FAST_FOOD":
      return 1;
    case "CAFE": {
      const c = cuisineList(tags);
      return c.some((x) => x === "coffee_shop" || x === "cake" || x === "bakery") || tags.takeaway === "only" ? 1 : 2;
    }
    case "RESTAURANT": {
      let tier = 2;
      const c = cuisineList(tags);
      if (c.some((x) => PRICEY_CUISINES.includes(x))) tier++;
      if (c.some((x) => CHEAP_CUISINES.includes(x))) tier--;
      if (tags["michelin"] || tags["stars"] || tags["award:michelin"]) tier = 4;
      if (tags["diet:vegan"] === "only" || tags["self_service"] === "yes") tier--;
      if (tags["payment:credit_cards"] === "no" || tags["payment:cards"] === "no") tier--;
      if (tags["reservation"] === "required") tier++;
      return clamp(tier);
    }
    case "NIGHTLIFE":
      return 2;
    case "HOSTEL":
    case "CAMP_SITE":
      return 1;
    case "GUEST_HOUSE":
      return 2;
    case "HOTEL": {
      const stars = Number.parseFloat(tags.stars ?? "");
      if (Number.isFinite(stars)) return stars <= 2 ? 2 : stars < 4 ? 3 : 4;
      return 3;
    }
    case "MUSEUM":
    case "GALLERY":
    case "ATTRACTION":
    case "HISTORIC":
      // free sights still get tier 1; isFree() below decides whether to charge at all
      return tags.fee === "no" ? 1 : category === "MUSEUM" ? 2 : 1;
    case "VIEWPOINT":
    case "PARK":
      return 1;
    default:
      return null;
  }
}

/** Places that cost nothing to visit. */
export function isFree(category: PoiCategory, tags: Tags = {}) {
  if (tags.fee === "no") return true;
  if (tags.fee === "yes") return false;
  return category === "VIEWPOINT" || category === "PARK" || category === "HISTORIC";
}

export type TierRange = { tier: number; min: number; max: number; currency: string };

/**
 * Generic fallback (USD) used only when no CostEstimate rows exist for a country.
 * Values per tier: [min, max].
 */
export const FALLBACK_USD: Record<"MEAL" | "STAY_NIGHT" | "ATTRACTION_ENTRY", Record<number, [number, number]>> = {
  MEAL: { 1: [6, 12], 2: [12, 25], 3: [25, 50], 4: [50, 120] },
  STAY_NIGHT: { 1: [20, 45], 2: [45, 90], 3: [90, 180], 4: [180, 400] },
  ATTRACTION_ENTRY: { 1: [0, 8], 2: [8, 20], 3: [20, 40], 4: [40, 80] },
};

/** Midpoint used as the single planning cost for a tier. */
export const midpoint = (r: { min: number; max: number }) => Math.round(((r.min + r.max) / 2) * 100) / 100;

/** Which tiers fit under a per-unit budget (used by the "within my budget" filter). */
export function tiersWithin(budget: number, ranges: TierRange[]) {
  return ranges.filter((r) => midpoint(r) <= budget).map((r) => r.tier);
}
