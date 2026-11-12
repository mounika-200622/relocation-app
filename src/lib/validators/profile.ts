import { z } from "zod";
import { cleanText, currency, dateString, optionalId } from "@/lib/validators/common";

export const userProfileSchema = z.object({
  name: cleanText(80).pipe(z.string().min(2, "Name must be at least 2 characters.")).optional(),
  occupation: z.enum(["STUDENT", "PROFESSIONAL", "OTHER"]),
  organization: cleanText(120).optional().nullable(),
  homeCountryId: optionalId.nullable(),
  destinationCityId: optionalId.nullable(),
  budgetMonthly: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
  budgetCurrency: currency.nullable().optional(),
  moveInDate: dateString.nullable().optional(),
  bio: cleanText(600).nullable().optional(),
  gender: z.enum(["FEMALE", "MALE", "NON_BINARY", "UNDISCLOSED"]),
  smoking: z.enum(["NON_SMOKER", "OUTSIDE_ONLY", "SMOKER"]),
  hasPets: z.boolean(),
  okWithPets: z.boolean(),
  socialStyle: z.enum(["QUIET", "BALANCED", "SOCIAL"]),
  sleepSchedule: z.enum(["EARLY_BIRD", "FLEXIBLE", "NIGHT_OWL"]),
  roommateGender: z.enum(["ANYONE", "FEMALE_ONLY", "MALE_ONLY"]),
  languages: z.array(z.string().max(8)).max(12).default([]),
});
export type UserProfileInput = z.infer<typeof userProfileSchema>;

export const businessProfileSchema = z.object({
  name: cleanText(80).pipe(z.string().min(2)).optional(),
  displayName: cleanText(120).pipe(z.string().min(2, "Enter your business name.")),
  description: cleanText(1000).nullable().optional(),
});
