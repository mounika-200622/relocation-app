import { describe, expect, it } from "vitest";
import { BudgetLedger, DEFAULT_SPLIT, allocate, minimumViableBudget, normalizeSplit, summarize, unitBudgets } from "@/lib/budget";

describe("normalizeSplit", () => {
  it("keeps a valid split unchanged", () => {
    expect(normalizeSplit(DEFAULT_SPLIT)).toEqual(DEFAULT_SPLIT);
  });
  it("rescales shares that do not add up to 100", () => {
    const s = normalizeSplit({ stay: 50, food: 50, activities: 50, transport: 50 });
    expect(s.stay + s.food + s.activities + s.transport).toBe(100);
    expect(s).toEqual({ stay: 25, food: 25, activities: 25, transport: 25 });
  });
  it("handles rounding remainders and clamps negatives", () => {
    const s = normalizeSplit({ stay: 33, food: 33, activities: 33, transport: -5 });
    expect(s.stay + s.food + s.activities + s.transport).toBe(100);
    expect(s.transport).toBe(0);
  });
});

describe("allocate", () => {
  it("parts always sum exactly to the total", () => {
    for (const total of [1, 99.99, 1234.57, 2000, 10_000.01]) {
      const a = allocate(total, { stay: 37, food: 29, activities: 21, transport: 13 });
      const sum = Math.round((a.stay + a.food + a.activities + a.transport) * 100);
      expect(sum).toBe(Math.round(total * 100));
    }
  });
});

describe("unitBudgets", () => {
  it("derives per-night and per-meal caps", () => {
    const u = unitBudgets({ total: 1000, split: DEFAULT_SPLIT, days: 3, people: 2, rooms: 1 });
    expect(u.nights).toBe(2);
    expect(u.perRoomNight).toBe(200);
    expect(u.perMeal.dinner).toBeCloseTo((300 / 6) * 0.45, 5);
  });
});

describe("BudgetLedger", () => {
  it("never lets spending exceed a category cap or the total", () => {
    const total = 500;
    const ledger = new BudgetLedger(total, allocate(total, DEFAULT_SPLIT));
    let added = 0;
    for (let i = 0; i < 200; i++) {
      const cat = (["stay", "food", "activities", "transport"] as const)[i % 4];
      const price = (i * 7.31) % 60;
      if (ledger.tryAdd(cat, price)) added += price;
    }
    expect(ledger.spent()).toBeLessThanOrEqual(total);
    expect(Math.abs(ledger.spent() - added)).toBeLessThan(0.01);
    expect(ledger.remaining("food")).toBeGreaterThanOrEqual(0);
  });

  it("rejects negative amounts", () => {
    const ledger = new BudgetLedger(100, allocate(100, DEFAULT_SPLIT));
    expect(ledger.tryAdd("food", -5)).toBe(false);
  });

  it("can move leftover money between categories", () => {
    const ledger = new BudgetLedger(100, allocate(100, DEFAULT_SPLIT));
    ledger.tryAdd("stay", 10);
    expect(ledger.reassign("stay", "food")).toBe(30);
    expect(ledger.remaining("food")).toBe(60);
    expect(ledger.tryAdd("food", 60)).toBe(true);
    expect(ledger.spent()).toBe(70);
  });
});

describe("minimumViableBudget", () => {
  it("adds the cheapest stay, food and transport", () => {
    expect(minimumViableBudget({ roomNight: 50, meal: 10, transportDay: 5 }, 3, 2, 1)).toBe(50 * 2 + 10 * 2 * 3 * 2 + 5 * 3 * 2);
  });
});

describe("summarize", () => {
  it("reports over-budget plans", () => {
    const s = summarize([{ kind: "STAY", cost: 90 }, { kind: "FOOD", cost: 20 }], 100, DEFAULT_SPLIT);
    expect(s.overBudget).toBe(true);
    expect(s.totalSpent).toBe(110);
  });
});
