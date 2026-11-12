import { prisma } from "@/lib/prisma";
import { num } from "@/lib/format";
import type { ProfileData } from "@/components/profile-form";

/** Loads a user's profile in the shape ProfileForm expects (server side). */
export async function loadProfileData(userId: number): Promise<ProfileData> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, profile: true, languages: { select: { languageCode: true } } } });
  const p = u.profile;
  return {
    name: u.name,
    occupation: p?.occupation ?? "STUDENT",
    organization: p?.organization ?? "",
    homeCountryId: p?.homeCountryId ?? null,
    destinationCityId: p?.destinationCityId ?? null,
    budgetMonthly: p?.budgetMonthly ? String(num(p.budgetMonthly)) : "",
    budgetCurrency: p?.budgetCurrency ?? "",
    moveInDate: p?.moveInDate ? p.moveInDate.toISOString().slice(0, 10) : "",
    bio: p?.bio ?? "",
    gender: p?.gender ?? "UNDISCLOSED",
    smoking: p?.smoking ?? "NON_SMOKER",
    hasPets: p?.hasPets ?? false,
    okWithPets: p?.okWithPets ?? true,
    socialStyle: p?.socialStyle ?? "BALANCED",
    sleepSchedule: p?.sleepSchedule ?? "FLEXIBLE",
    roommateGender: p?.roommateGender ?? "ANYONE",
    languages: u.languages.map((l) => l.languageCode),
  };
}
