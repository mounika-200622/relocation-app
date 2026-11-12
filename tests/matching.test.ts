import { describe, expect, it } from "vitest";
import { DEFAULT_PROFILE, budgetScore, computeCompatibility, moveInScore, smokingScore, type MatchProfile } from "@/lib/matching";

const base = (over: Partial<MatchProfile> = {}): MatchProfile => ({
  ...DEFAULT_PROFILE,
  cityId: 1,
  budget: 900,
  moveIn: new Date("2026-09-01"),
  ...over,
});
const listing = { cityId: 1, genderPreference: "ANYONE" as const };

describe("computeCompatibility", () => {
  it("gives 100 to two identical, compatible profiles", () => {
    const r = computeCompatibility(base(), base(), listing);
    expect(r.total).toBe(100);
    expect(r.sameCity).toBe(true);
  });

  it("scores budget as the ratio of smaller to larger", () => {
    expect(budgetScore(600, 1200)).toBe(15);
    expect(budgetScore(null, 1200)).toBe(15);
    expect(budgetScore(1000, 1000)).toBe(30);
  });

  it("decays move-in points linearly to zero at 60 days", () => {
    const d = new Date("2026-09-01");
    expect(moveInScore(d, new Date("2026-09-01"))).toBe(20);
    expect(moveInScore(d, new Date("2026-10-01"))).toBeCloseTo(10, 5);
    expect(moveInScore(d, new Date("2026-12-01"))).toBe(0);
    expect(moveInScore(null, d)).toBe(10);
  });

  it("zeroes gender points when the listing is women-only and the viewer is not a woman", () => {
    const r = computeCompatibility(base({ gender: "MALE" }), base({ gender: "FEMALE" }), { cityId: 1, genderPreference: "FEMALE_ONLY" });
    expect(r.gender).toBe(0);
  });

  it("respects the other person's roommate gender preference", () => {
    const r = computeCompatibility(base({ gender: "MALE" }), base({ roommateGender: "FEMALE_ONLY" }), listing);
    expect(r.gender).toBe(0);
  });

  it("penalises smoker vs non-smoker but not outside-only", () => {
    expect(smokingScore("SMOKER", "NON_SMOKER")).toBe(0);
    expect(smokingScore("OUTSIDE_ONLY", "NON_SMOKER")).toBe(5);
  });

  it("zeroes pet points when one has pets and the other is not ok with them", () => {
    const r = computeCompatibility(base({ hasPets: true }), base({ okWithPets: false }), listing);
    expect(r.pets).toBe(0);
  });

  it("uses the request's budget share and move-in date over the profile", () => {
    const r = computeCompatibility(base({ budget: 1000 }), base({ budget: 100 }), listing, { otherBudget: 1000 });
    expect(r.budget).toBe(30);
  });

  it("flags different cities", () => {
    expect(computeCompatibility(base({ cityId: 2 }), base(), listing).sameCity).toBe(false);
  });

  it("is always between 0 and 100", () => {
    const worst = computeCompatibility(
      base({ gender: "MALE", smoking: "SMOKER", hasPets: true, social: "QUIET", sleep: "EARLY_BIRD", budget: 100, moveIn: new Date("2026-01-01") }),
      base({ roommateGender: "FEMALE_ONLY", smoking: "NON_SMOKER", okWithPets: false, social: "SOCIAL", sleep: "NIGHT_OWL", budget: 5000, moveIn: new Date("2026-12-01") }),
      listing,
    );
    expect(worst.total).toBeGreaterThanOrEqual(0);
    expect(worst.total).toBeLessThan(10);
  });
});
