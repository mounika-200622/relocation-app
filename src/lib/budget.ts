/**
 * Trip budget allocation. See docs/trip-algorithm.md.
 * All money is handled in integer cents so allocations always add up exactly.
 */
export type BudgetCategory = "stay" | "food" | "activities" | "transport";
export type Split = Record<BudgetCategory, number>;

export const CATEGORIES: BudgetCategory[] = ["stay", "food", "activities", "transport"];
export const DEFAULT_SPLIT: Split = { stay: 40, food: 30, activities: 20, transport: 10 };

/** Share of the daily food budget per meal (breakfast is cheaper than dinner). */
export const MEAL_WEIGHTS = { breakfast: 0.2, lunch: 0.35, dinner: 0.45 } as const;

const toCents = (x: number) => Math.round(x * 100);
const fromCents = (c: number) => c / 100;

/** Clamps each share to 0..100 and rescales so the integers sum to exactly 100. */
export function normalizeSplit(split: Partial<Split>): Split {
  const raw = CATEGORIES.map((c) => Math.max(0, Math.min(100, Math.round(split[c] ?? DEFAULT_SPLIT[c]))));
  const sum = raw.reduce((a, b) => a + b, 0);
  if (sum === 0) return { ...DEFAULT_SPLIT };
  const scaled = raw.map((v) => Math.floor((v * 100) / sum));
  // hand the rounding remainder to the largest shares first
  let rest = 100 - scaled.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) scaled[order[k]!.i]!++;
  return Object.fromEntries(CATEGORIES.map((c, i) => [c, scaled[i]!])) as Split;
}

/** Splits a total into the four categories; the parts sum exactly to the total. */
export function allocate(total: number, split: Split): Record<BudgetCategory, number> {
  const totalCents = toCents(total);
  const parts = CATEGORIES.map((c) => Math.floor((totalCents * split[c]) / 100));
  parts[0]! += totalCents - parts.reduce((a, b) => a + b, 0); // remainder cents go to stay
  return Object.fromEntries(CATEGORIES.map((c, i) => [c, fromCents(parts[i]!)])) as Record<BudgetCategory, number>;
}

export function nightsFor(days: number) {
  return Math.max(1, days - 1);
}

export type TripShape = { total: number; split: Split; days: number; people: number; rooms: number };

/** Per-unit spending caps the generator uses when picking places. */
export function unitBudgets({ total, split, days, people, rooms }: TripShape) {
  const a = allocate(total, split);
  const nights = nightsFor(days);
  const foodPerPersonDay = a.food / (days * people);
  return {
    allocation: a,
    nights,
    perRoomNight: a.stay / (nights * rooms),
    perMeal: {
      breakfast: foodPerPersonDay * MEAL_WEIGHTS.breakfast,
      lunch: foodPerPersonDay * MEAL_WEIGHTS.lunch,
      dinner: foodPerPersonDay * MEAL_WEIGHTS.dinner,
    },
    activitiesPerPersonDay: a.activities / (days * people),
    transportPerPersonDay: a.transport / (days * people),
  };
}

/** Cheapest possible trip from the cheapest known prices; tells the user what is viable. */
export function minimumViableBudget(
  cheapest: { roomNight: number; meal: number; transportDay: number },
  days: number,
  people: number,
  rooms: number,
) {
  const stay = cheapest.roomNight * nightsFor(days) * rooms;
  // breakfast+lunch+dinner at the cheapest meal price, scaled like MEAL_WEIGHTS around lunch
  const food = cheapest.meal * 2 * days * people;
  const transport = cheapest.transportDay * days * people;
  return Math.ceil(stay + food + transport);
}

/**
 * Tracks spending per category and refuses anything that would exceed either the
 * category cap or the overall total. This is the "never exceeds the budget" guarantee.
 */
export class BudgetLedger {
  private spentCents: Record<BudgetCategory, number> = { stay: 0, food: 0, activities: 0, transport: 0 };
  private capsCents: Record<BudgetCategory, number>;
  private totalCents: number;

  constructor(total: number, caps: Record<BudgetCategory, number>) {
    this.totalCents = toCents(total);
    this.capsCents = Object.fromEntries(CATEGORIES.map((c) => [c, toCents(caps[c])])) as Record<BudgetCategory, number>;
  }

  canAfford(category: BudgetCategory, amount: number) {
    const c = toCents(amount);
    return c >= 0 && this.spentCents[category] + c <= this.capsCents[category] && this.totalSpentCents() + c <= this.totalCents;
  }

  /** Adds the cost if affordable; returns whether it was added. */
  tryAdd(category: BudgetCategory, amount: number) {
    if (!this.canAfford(category, amount)) return false;
    this.spentCents[category] += toCents(amount);
    return true;
  }

  /** Moves unused money from one category's cap to another (e.g. leftover stay → food). */
  reassign(from: BudgetCategory, to: BudgetCategory) {
    const unused = this.capsCents[from] - this.spentCents[from];
    if (unused <= 0) return 0;
    this.capsCents[from] -= unused;
    this.capsCents[to] += unused;
    return fromCents(unused);
  }

  remaining(category: BudgetCategory) {
    return fromCents(this.capsCents[category] - this.spentCents[category]);
  }

  spent(category?: BudgetCategory) {
    return fromCents(category ? this.spentCents[category] : this.totalSpentCents());
  }

  private totalSpentCents() {
    return CATEGORIES.reduce((s, c) => s + this.spentCents[c], 0);
  }
}

/** Summarises saved items into spent-per-category for the budget meter. */
export function summarize(items: { kind: "STAY" | "FOOD" | "ACTIVITY" | "TRANSPORT"; cost: number }[], total: number, split: Split) {
  const caps = allocate(total, split);
  const map: Record<string, BudgetCategory> = { STAY: "stay", FOOD: "food", ACTIVITY: "activities", TRANSPORT: "transport" };
  const spent: Record<BudgetCategory, number> = { stay: 0, food: 0, activities: 0, transport: 0 };
  for (const it of items) spent[map[it.kind]!] += toCents(it.cost);
  const out = CATEGORIES.map((c) => ({ category: c, cap: caps[c], spent: fromCents(spent[c]) }));
  const totalSpent = fromCents(CATEGORIES.reduce((s, c) => s + spent[c], 0));
  return { categories: out, totalSpent, remaining: Math.round((total - totalSpent) * 100) / 100, overBudget: totalSpent > total + 0.001 };
}
