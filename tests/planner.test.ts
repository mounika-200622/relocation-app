import { describe, expect, it } from "vitest";
import { plan, pickByStyle, type Candidate, type PlanInput } from "@/lib/trip/planner";
import { DEFAULT_SPLIT } from "@/lib/budget";

const center = { lat: 47.3769, lng: 8.5417 };
let n = 0;
const c = (category: string, unitPrice: number, dLat = 0, dLng = 0): Candidate => ({
  key: `poi:${++n}`, poiId: n, title: `${category} ${n}`, category, unitPrice, tier: null, lat: center.lat + dLat, lng: center.lng + dLng,
});

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    center, days: 3, people: 2, rooms: 1, budget: 1500, split: DEFAULT_SPLIT, style: "BALANCED", pace: "NORMAL",
    stays: [c("HOSTEL", 110), c("HOTEL", 260, 0.01), c("GUEST_HOUSE", 170, -0.01)],
    breakfasts: Array.from({ length: 6 }, (_, i) => c("CAFE", 8 + i, 0.001 * i)),
    meals: Array.from({ length: 12 }, (_, i) => c("RESTAURANT", 15 + i * 3, 0.002 * i, 0.001 * i)),
    sights: Array.from({ length: 15 }, (_, i) => c(i % 3 ? "MUSEUM" : "PARK", i % 3 ? 15 : 0, 0.003 * i, -0.002 * i)),
    evening: [c("NIGHTLIFE", 12, 0.004)],
    transportPerPersonDay: 9,
    cheapest: { roomNight: 110, meal: 8, transportDay: 9 },
    ...over,
  };
}

describe("trip planner", () => {
  it("never spends more than the budget, for many budgets and styles", () => {
    for (const budget of [300, 600, 900, 1500, 3000, 8000]) {
      for (const style of ["BUDGET", "BALANCED", "COMFORT"] as const) {
        const r = plan(input({ budget, style }));
        const total = r.items.reduce((s, i) => s + i.estimatedCost, 0);
        expect(total).toBeLessThanOrEqual(budget + 0.001);
        expect(Math.abs(total - r.spent)).toBeLessThan(0.01);
      }
    }
  });

  it("plans every day with meals and sights", () => {
    const r = plan(input());
    expect(r.feasible).toBe(true);
    for (let d = 1; d <= 3; d++) {
      expect(r.items.filter((i) => i.dayNumber === d && i.kind === "FOOD")).toHaveLength(3);
      expect(r.items.some((i) => i.dayNumber === d && i.kind === "ACTIVITY")).toBe(true);
    }
    expect(r.items.filter((i) => i.kind === "STAY")).toHaveLength(1);
  });

  it("does not repeat places", () => {
    const r = plan(input());
    const ids = r.items.filter((i) => i.poiId).map((i) => i.poiId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("flags budgets below the minimum viable amount", () => {
    const r = plan(input({ budget: 150 }));
    expect(r.feasible).toBe(false);
    expect(r.minViableBudget).toBe(110 * 2 * 1 + 8 * 2 * 3 * 2 + 9 * 3 * 2);
    expect(r.warnings[0]).toMatch(/minimum/);
  });

  it("COMFORT picks a pricier stay than BUDGET", () => {
    const cheap = plan(input({ style: "BUDGET", budget: 4000 })).items.find((i) => i.kind === "STAY")!;
    const lux = plan(input({ style: "COMFORT", budget: 4000 })).items.find((i) => i.kind === "STAY")!;
    expect(lux.estimatedCost).toBeGreaterThan(cheap.estimatedCost);
  });

  it("packed days have more activities than relaxed ones", () => {
    const count = (pace: "RELAXED" | "PACKED") => plan(input({ pace, budget: 5000 })).items.filter((i) => i.kind === "ACTIVITY").length;
    expect(count("PACKED")).toBeGreaterThan(count("RELAXED"));
  });

  it("pickByStyle respects the cap", () => {
    const list = [c("X", 10), c("X", 20), c("X", 30)];
    expect(pickByStyle(list, 25, "COMFORT", center, (x) => x.unitPrice)?.unitPrice).toBe(20);
    expect(pickByStyle(list, 25, "BUDGET", center, (x) => x.unitPrice)?.unitPrice).toBe(10);
    expect(pickByStyle(list, 5, "BUDGET", center, (x) => x.unitPrice)).toBeNull();
  });
});
