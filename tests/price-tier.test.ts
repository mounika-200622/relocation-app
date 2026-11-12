import { describe, expect, it } from "vitest";
import { derivePriceTier, isFree, midpoint, tiersWithin } from "@/lib/poi/price-tier";

describe("derivePriceTier", () => {
  it("fast food is always tier 1", () => {
    expect(derivePriceTier("FAST_FOOD", {})).toBe(1);
  });
  it("restaurants default to 2 and move with cuisine", () => {
    expect(derivePriceTier("RESTAURANT", {})).toBe(2);
    expect(derivePriceTier("RESTAURANT", { cuisine: "pizza" })).toBe(1);
    expect(derivePriceTier("RESTAURANT", { cuisine: "french" })).toBe(3);
    expect(derivePriceTier("RESTAURANT", { cuisine: "sushi", reservation: "required" })).toBe(4);
  });
  it("michelin restaurants are tier 4", () => {
    expect(derivePriceTier("RESTAURANT", { "award:michelin": "1" })).toBe(4);
  });
  it("tiers stay within 1..4", () => {
    expect(derivePriceTier("RESTAURANT", { cuisine: "kebab", "diet:vegan": "only", "payment:cards": "no" })).toBe(1);
  });
  it("hotels use stars", () => {
    expect(derivePriceTier("HOTEL", { stars: "2" })).toBe(2);
    expect(derivePriceTier("HOTEL", { stars: "5" })).toBe(4);
    expect(derivePriceTier("HOTEL", {})).toBe(3);
    expect(derivePriceTier("HOSTEL", {})).toBe(1);
  });
  it("non-priced categories return null", () => {
    expect(derivePriceTier("PHARMACY", {})).toBeNull();
    expect(derivePriceTier("SUPERMARKET", {})).toBeNull();
  });
});

describe("isFree / tiersWithin", () => {
  it("knows free sights", () => {
    expect(isFree("PARK")).toBe(true);
    expect(isFree("MUSEUM")).toBe(false);
    expect(isFree("MUSEUM", { fee: "no" })).toBe(true);
  });
  it("filters tiers whose midpoint fits the budget", () => {
    const ranges = [
      { tier: 1, min: 10, max: 20, currency: "CHF" },
      { tier: 2, min: 20, max: 40, currency: "CHF" },
      { tier: 3, min: 40, max: 80, currency: "CHF" },
    ];
    expect(midpoint(ranges[1]!)).toBe(30);
    expect(tiersWithin(30, ranges)).toEqual([1, 2]);
  });
});
