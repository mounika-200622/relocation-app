import { expect, it } from "vitest";
import { DEFAULT_PROFILE, computeCompatibility } from "@/lib/matching";

// The worked example in docs/matching-algorithm.md must stay true.
it("matches the documented example (95)", () => {
  const a = { ...DEFAULT_PROFILE, cityId: 1, budget: 1000, moveIn: new Date("2026-12-12"), social: "BALANCED" as const, sleep: "NIGHT_OWL" as const, okWithPets: true };
  const b = { ...DEFAULT_PROFILE, cityId: 1, budget: 1050, moveIn: new Date("2026-12-09"), social: "BALANCED" as const, sleep: "FLEXIBLE" as const, hasPets: true };
  expect(computeCompatibility(a, b, { cityId: 1, genderPreference: "ANYONE" }).total).toBe(95);
});
