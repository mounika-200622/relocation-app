import { z } from "zod";
import { cleanText, currency, dateString, id } from "@/lib/validators/common";

export const INTERESTS = ["CULTURE", "FOOD", "NATURE", "NIGHTLIFE", "SHOPPING", "ADVENTURE", "FAMILY"] as const;

const split = z
  .object({
    stay: z.coerce.number().int().min(0).max(100),
    food: z.coerce.number().int().min(0).max(100),
    activities: z.coerce.number().int().min(0).max(100),
    transport: z.coerce.number().int().min(0).max(100),
  })
  .refine((s) => s.stay + s.food + s.activities + s.transport === 100, "The budget split must add up to 100%.");

export const tripCreateSchema = z.object({
  title: cleanText(120).optional(),
  cityId: id,
  days: z.coerce.number().int().min(1, "At least one day.").max(30, "Plan up to 30 days at a time."),
  people: z.coerce.number().int().min(1).max(50),
  rooms: z.coerce.number().int().min(1).max(50).optional(),
  budget: z.coerce.number().positive("Enter your total budget.").max(10_000_000),
  currency,
  startDate: dateString.nullable().optional(),
  style: z.enum(["BUDGET", "BALANCED", "COMFORT"]).default("BALANCED"),
  pace: z.enum(["RELAXED", "NORMAL", "PACKED"]).default("NORMAL"),
  stayPreference: z.enum(["ANY", "HOSTEL", "HOTEL", "APARTMENT"]).default("ANY"),
  interests: z.array(z.enum(INTERESTS)).max(7).default([]),
  split: split.optional(),
});
export type TripCreateInput = z.infer<typeof tripCreateSchema>;

export const tripUpdateSchema = z.object({
  title: cleanText(120).pipe(z.string().min(1)).optional(),
  split: split.optional(),
});

export const addItemSchema = z.object({
  dayNumber: z.coerce.number().int().min(1).max(30),
  timeSlot: z.enum(["MORNING", "LUNCH", "AFTERNOON", "DINNER", "EVENING"]),
  poiId: id.optional(),
  title: cleanText(200).optional(),
  estimatedCost: z.coerce.number().min(0).max(1_000_000).optional(),
  notes: cleanText(300).optional(),
}).refine((v) => v.poiId || v.title, "Pick a place or give the item a name.");

export const swapItemSchema = z.object({ poiId: id });
