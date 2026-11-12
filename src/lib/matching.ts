/**
 * Roommate compatibility score (0-100).
 * Mirrors the SQL view v_roommate_compatibility exactly; see docs/matching-algorithm.md.
 *
 *   budget overlap   30  ratio smaller/larger monthly budget (15 if unknown)
 *   move-in date     20  linear: same day = 20, ≥ 60 days apart = 0 (10 if unknown)
 *   gender           20  listing rule + both people's roommate preference must hold
 *   smoking          10  same = 10, smoker vs non-smoker = 0, otherwise 5
 *   pets             10  0 if one has pets and the other is not ok with pets
 *   social style      5  same = 5, one BALANCED = 2.5, QUIET vs SOCIAL = 0
 *   sleep schedule    5  same = 5, one FLEXIBLE = 2.5, otherwise 0
 *
 * Same destination city is a hard filter applied before scoring.
 */
export type Gender = "FEMALE" | "MALE" | "NON_BINARY" | "UNDISCLOSED";
export type Pref = "ANYONE" | "FEMALE_ONLY" | "MALE_ONLY";
export type Smoking = "NON_SMOKER" | "OUTSIDE_ONLY" | "SMOKER";
export type Social = "QUIET" | "BALANCED" | "SOCIAL";
export type Sleep = "EARLY_BIRD" | "FLEXIBLE" | "NIGHT_OWL";

export type MatchProfile = {
  cityId: number | null;
  budget: number | null;
  moveIn: Date | null;
  gender: Gender;
  roommateGender: Pref;
  smoking: Smoking;
  hasPets: boolean;
  okWithPets: boolean;
  social: Social;
  sleep: Sleep;
};

export type ScoreBreakdown = {
  total: number;
  budget: number;
  moveIn: number;
  gender: number;
  smoking: number;
  pets: number;
  social: number;
  sleep: number;
  sameCity: boolean;
};

export const DEFAULT_PROFILE: MatchProfile = {
  cityId: null,
  budget: null,
  moveIn: null,
  gender: "UNDISCLOSED",
  roommateGender: "ANYONE",
  smoking: "NON_SMOKER",
  hasPets: false,
  okWithPets: true,
  social: "BALANCED",
  sleep: "FLEXIBLE",
};

const DAY = 86_400_000;

function genderAllowed(rule: Pref, gender: Gender) {
  if (rule === "FEMALE_ONLY") return gender === "FEMALE";
  if (rule === "MALE_ONLY") return gender === "MALE";
  return true;
}

export function budgetScore(a: number | null, b: number | null) {
  if (a === null || b === null || Math.max(a, b) === 0) return 15;
  return (30 * Math.min(a, b)) / Math.max(a, b);
}

export function moveInScore(a: Date | null, b: Date | null) {
  if (!a || !b) return 10;
  const days = Math.abs(Math.round((a.getTime() - b.getTime()) / DAY));
  return 20 * Math.max(0, 1 - days / 60);
}

export function smokingScore(a: Smoking, b: Smoking) {
  if (a === b) return 10;
  if ((a === "NON_SMOKER" && b === "SMOKER") || (a === "SMOKER" && b === "NON_SMOKER")) return 0;
  return 5;
}

function middleScore<T extends string>(a: T, b: T, middle: T) {
  if (a === b) return 5;
  if (a === middle || b === middle) return 2.5;
  return 0;
}

/**
 * @param viewer  the person looking for a roommate
 * @param other   the person who posted the roommate request
 * @param listing the shared place (its city and gender rule)
 * @param otherBudget the budget share stated on the request (falls back to the profile)
 */
export function computeCompatibility(
  viewer: MatchProfile,
  other: MatchProfile,
  listing: { cityId: number; genderPreference: Pref },
  overrides: { otherBudget?: number | null; otherMoveIn?: Date | null } = {},
): ScoreBreakdown {
  const sameCity = viewer.cityId !== null && viewer.cityId === listing.cityId;
  const otherBudget = overrides.otherBudget ?? other.budget;
  const otherMoveIn = overrides.otherMoveIn ?? other.moveIn;

  const budget = budgetScore(viewer.budget, otherBudget);
  const moveIn = moveInScore(viewer.moveIn, otherMoveIn);
  const genderOk =
    genderAllowed(listing.genderPreference, viewer.gender) &&
    genderAllowed(viewer.roommateGender, other.gender) &&
    genderAllowed(other.roommateGender, viewer.gender);
  const gender = genderOk ? 20 : 0;
  const smoking = smokingScore(viewer.smoking, other.smoking);
  const pets = (viewer.hasPets && !other.okWithPets) || (other.hasPets && !viewer.okWithPets) ? 0 : 10;
  const social = middleScore(viewer.social, other.social, "BALANCED");
  const sleep = middleScore(viewer.sleep, other.sleep, "FLEXIBLE");

  const total = Math.round(budget + moveIn + gender + smoking + pets + social + sleep);
  return { total, budget, moveIn, gender, smoking, pets, social, sleep, sameCity };
}

export function matchLabel(score: number) {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Great match";
  if (score >= 50) return "Good match";
  return "Possible match";
}
