/**
 * Pure itinerary planner (no I/O) – see docs/trip-algorithm.md.
 * Every price passed in is already in the trip's currency.
 */
import { BudgetLedger, MEAL_WEIGHTS, allocate, minimumViableBudget, nightsFor, type Split } from "@/lib/budget";
import { haversineKm, nearestNeighbourOrder, type LatLng } from "@/lib/geo";

export type Style = "BUDGET" | "BALANCED" | "COMFORT";
export type Pace = "RELAXED" | "NORMAL" | "PACKED";
export type Slot = "STAY" | "MORNING" | "LUNCH" | "AFTERNOON" | "DINNER" | "EVENING";

export type Candidate = LatLng & {
  key: string; // "poi:12" | "listing:7"
  poiId?: number;
  listingId?: number;
  title: string;
  category: string;
  /** price per unit: per room-night (stays), per person (meals, entries) */
  unitPrice: number;
  tier: number | null;
};

export type PlanInput = {
  center: LatLng;
  days: number;
  people: number;
  rooms: number;
  budget: number;
  split: Split;
  style: Style;
  pace: Pace;
  stays: Candidate[];
  breakfasts: Candidate[];
  meals: Candidate[];
  sights: Candidate[];
  evening: Candidate[];
  transportPerPersonDay: number | null;
  cheapest: { roomNight: number; meal: number; transportDay: number };
};

export type PlannedItem = {
  dayNumber: number;
  timeSlot: Slot;
  kind: "STAY" | "FOOD" | "ACTIVITY" | "TRANSPORT";
  position: number;
  poiId?: number;
  listingId?: number;
  title: string;
  estimatedCost: number;
  lat?: number;
  lng?: number;
  notes?: string;
};

export type PlanResult = {
  items: PlannedItem[];
  spent: number;
  minViableBudget: number;
  feasible: boolean;
  warnings: string[];
};

const ACTIVITIES_PER_DAY: Record<Pace, number> = { RELAXED: 2, NORMAL: 3, PACKED: 4 };
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Chooses within a cap according to style: BUDGET = cheapest that fits, COMFORT = most
 * expensive that fits, BALANCED = closest to 70 % of the cap. Ties go to the nearer place.
 */
export function pickByStyle(cands: Candidate[], cap: number, style: Style, from: LatLng, costOf: (c: Candidate) => number) {
  const fits = cands.filter((c) => costOf(c) <= cap + 1e-9);
  if (!fits.length) return null;
  const target = style === "BUDGET" ? 0 : style === "COMFORT" ? cap : cap * 0.7;
  return fits.reduce((best, c) => {
    const d = Math.abs(costOf(c) - target);
    const bd = Math.abs(costOf(best) - target);
    if (Math.abs(d - bd) > 0.5) return d < bd ? c : best;
    return haversineKm(from, c) < haversineKm(from, best) ? c : best;
  });
}

export function plan(input: PlanInput): PlanResult {
  const { days, people, rooms, budget, split, style, pace } = input;
  const caps = allocate(budget, split);
  const ledger = new BudgetLedger(budget, caps);
  const items: PlannedItem[] = [];
  const warnings: string[] = [];
  const used = new Set<string>();
  const nights = nightsFor(days);
  const minViable = minimumViableBudget(input.cheapest, days, people, rooms);
  let feasible = budget >= minViable;

  // 1. where to stay – the whole stay is bought at once (nights × rooms)
  const stayCost = (c: Candidate) => round2(c.unitPrice * nights * rooms);
  let lodging: LatLng = input.center;
  const stay = pickByStyle(input.stays, caps.stay, style, input.center, stayCost);
  if (stay && ledger.tryAdd("stay", stayCost(stay))) {
    used.add(stay.key);
    lodging = stay;
    items.push({
      dayNumber: 1, timeSlot: "STAY", kind: "STAY", position: 0, poiId: stay.poiId, listingId: stay.listingId, title: stay.title,
      estimatedCost: stayCost(stay), lat: stay.lat, lng: stay.lng,
      notes: `${nights} night${nights > 1 ? "s" : ""} × ${rooms} room${rooms > 1 ? "s" : ""} (≈ ${round2(stay.unitPrice)} per room-night)`,
    });
  } else {
    feasible = false;
    warnings.push(input.stays.length ? "No place to stay fits the stay budget – raise the budget or move money into 'stay'." : "We couldn't find places to stay in this area yet.");
  }
  // unused stay money can be spent on activities and food
  ledger.reassign("stay", "activities");

  // 2. sights per day: nearest-neighbour chains starting at the lodging keep each day walkable
  const perDay = ACTIVITIES_PER_DAY[pace];
  const pool = input.sights.filter((s) => !used.has(s.key));
  const activityCost = (c: Candidate) => round2(c.unitPrice * people);

  for (let day = 1; day <= days; day++) {
    let position = 1;
    // transport for the day
    if (input.transportPerPersonDay !== null) {
      const t = round2(input.transportPerPersonDay * people);
      if (ledger.tryAdd("transport", t)) {
        items.push({ dayNumber: day, timeSlot: "MORNING", kind: "TRANSPORT", position: 0, title: "Local transport day pass", estimatedCost: t, notes: `${people} × day ticket` });
      } else {
        warnings.push(`Day ${day}: no money left for public transport – plan to walk.`);
      }
    }

    // choose this day's sights, nearest first, skipping what we can't afford
    const todays: Candidate[] = [];
    let cursor: LatLng = lodging;
    while (todays.length < perDay) {
      const available = pool.filter((s) => !used.has(s.key));
      if (!available.length) break;
      const next = available.reduce((a, b) => (haversineKm(cursor, a) <= haversineKm(cursor, b) ? a : b));
      used.add(next.key);
      if (!ledger.canAfford("activities", activityCost(next))) continue; // too pricey: try the next nearest
      ledger.tryAdd("activities", activityCost(next));
      todays.push(next);
      cursor = next;
    }
    const ordered = nearestNeighbourOrder(lodging, todays);
    const slots: Slot[] = ["MORNING", "AFTERNOON", "AFTERNOON", "EVENING"];
    ordered.forEach((s, i) => {
      items.push({
        dayNumber: day, timeSlot: slots[Math.min(i, slots.length - 1)]!, kind: "ACTIVITY", position: position++, poiId: s.poiId, title: s.title,
        estimatedCost: activityCost(s), lat: s.lat, lng: s.lng, notes: s.unitPrice === 0 ? "Free entry" : undefined,
      });
    });
    if (!ordered.length) warnings.push(`Day ${day}: free day – no more sights match your interests nearby.`);

    // 3. meals near where you'll be at that time
    const foodPerPersonDay = caps.food / (days * people);
    const mealPlan: { slot: Slot; near: LatLng; list: Candidate[]; share: number; label: string }[] = [
      { slot: "MORNING", near: lodging, list: input.breakfasts, share: MEAL_WEIGHTS.breakfast, label: "Breakfast" },
      { slot: "LUNCH", near: ordered[0] ?? lodging, list: input.meals, share: MEAL_WEIGHTS.lunch, label: "Lunch" },
      { slot: "DINNER", near: ordered[ordered.length - 1] ?? lodging, list: input.meals, share: MEAL_WEIGHTS.dinner, label: "Dinner" },
    ];
    for (const m of mealPlan) {
      const perPerson = foodPerPersonDay * m.share;
      const options = m.list.filter((c) => !used.has(c.key)).sort((a, b) => haversineKm(m.near, a) - haversineKm(m.near, b)).slice(0, 25);
      const choice = pickByStyle(options, perPerson, style, m.near, (c) => c.unitPrice);
      if (choice && ledger.tryAdd("food", round2(choice.unitPrice * people))) {
        used.add(choice.key);
        items.push({ dayNumber: day, timeSlot: m.slot, kind: "FOOD", position: position++, poiId: choice.poiId, title: `${m.label}: ${choice.title}`, estimatedCost: round2(choice.unitPrice * people), lat: choice.lat, lng: choice.lng });
      } else {
        items.push({ dayNumber: day, timeSlot: m.slot, kind: "FOOD", position: position++, title: `${m.label}: supermarket picnic`, estimatedCost: 0, notes: "Budget tip: grab food from a supermarket (counted under groceries you already have)." });
      }
    }

    // 4. optional evening activity for packed/normal days
    if (pace !== "RELAXED") {
      const options = input.evening.filter((c) => !used.has(c.key)).sort((a, b) => haversineKm(lodging, a) - haversineKm(lodging, b));
      const ev = options.find((c) => ledger.canAfford("activities", activityCost(c)));
      if (ev && ledger.tryAdd("activities", activityCost(ev))) {
        used.add(ev.key);
        items.push({ dayNumber: day, timeSlot: "EVENING", kind: "ACTIVITY", position: position++, poiId: ev.poiId, title: ev.title, estimatedCost: activityCost(ev), lat: ev.lat, lng: ev.lng });
      }
    }
  }

  if (budget < minViable) warnings.unshift(`Your budget is below the minimum we can plan for these dates (about ${minViable}).`);
  return { items, spent: ledger.spent(), minViableBudget: minViable, feasible, warnings: [...new Set(warnings)] };
}
