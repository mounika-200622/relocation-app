import { z } from "zod";
import { cleanText, currency, dateString, id, lat, lng, money, optionalId, qBool, qNum } from "@/lib/validators/common";

export const LISTING_TYPES = ["DORM", "APARTMENT", "STUDIO", "SHARED_ROOM", "PRIVATE_ROOM"] as const;
export const PREFERENCES = ["ANYONE", "FEMALE_ONLY", "MALE_ONLY"] as const;
export const LISTING_STATUSES = ["ACTIVE", "RENTED", "ARCHIVED"] as const;

const listingFields = z.object({
  title: cleanText(140).pipe(z.string().min(5, "Give it a title of at least 5 characters.")),
  description: cleanText(5000).optional().default(""),
  type: z.enum(LISTING_TYPES),
  address: cleanText(255).pipe(z.string().min(3, "Enter the street address.")),
  cityId: id,
  lat: lat.nullable().optional(),
  lng: lng.nullable().optional(),
  price: money.refine((n) => n > 0, "Enter the monthly price."),
  deposit: money.default(0),
  currency,
  bedrooms: z.coerce.number().int().min(0).max(20).default(1),
  bathrooms: z.coerce.number().int().min(0).max(20).default(1),
  sizeSqm: z.coerce.number().int().min(1).max(2000).nullable().optional(),
  furnished: z.boolean().default(false),
  availableFrom: dateString.nullable().optional(),
  minStayMonths: z.coerce.number().int().min(1).max(60).default(1),
  utilitiesIncluded: z.boolean().default(false),
  billsEstimate: money.nullable().optional(),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  guestsAllowed: z.boolean().default(true),
  isShareable: z.boolean().default(false),
  capacityMin: z.coerce.number().int().min(1).max(50).default(1),
  capacityMax: z.coerce.number().int().min(1).max(50).default(1),
  currentOccupants: z.coerce.number().int().min(0).max(50).default(0),
  genderPreference: z.enum(PREFERENCES).default("ANYONE"),
  amenityIds: z.array(id).max(40).default([]),
});

/** Same rules as the CHECK constraints, so users get a friendly message before the DB says no. */
const capacityRules = <T extends { capacityMin?: number; capacityMax?: number; currentOccupants?: number }>(v: T, ctx: z.RefinementCtx) => {
  if (v.capacityMin !== undefined && v.capacityMax !== undefined && v.capacityMin > v.capacityMax) {
    ctx.addIssue({ code: "custom", path: ["capacityMax"], message: "Maximum capacity must be at least the minimum." });
  }
  if (v.currentOccupants !== undefined && v.capacityMax !== undefined && v.currentOccupants > v.capacityMax) {
    ctx.addIssue({ code: "custom", path: ["currentOccupants"], message: "Current occupants can't exceed the maximum capacity." });
  }
};

export const listingCreateSchema = listingFields.superRefine(capacityRules);
export const listingUpdateSchema = listingFields.partial().superRefine(capacityRules);
export type ListingInput = z.infer<typeof listingCreateSchema>;

export const SORTS = ["newest", "price_asc", "price_desc", "nearest"] as const;

export const listingSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  countryId: optionalId,
  regionId: optionalId,
  cityId: optionalId,
  type: z.enum(LISTING_TYPES).optional().catch(undefined),
  minPrice: qNum(),
  maxPrice: qNum(),
  shareable: qBool,
  openSpots: qBool,
  furnished: qBool,
  gender: z.enum(PREFERENCES).optional().catch(undefined),
  availableBy: dateString.optional().catch(undefined),
  bedrooms: qNum(0, 20),
  amenities: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 20) : [])),
  sort: z.enum(SORTS).default("newest").catch("newest"),
  lat: lat.optional().catch(undefined),
  lng: lng.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});
export type ListingSearch = z.infer<typeof listingSearchSchema>;

export const statusChangeSchema = z.object({ status: z.enum(LISTING_STATUSES) });

export const photoUpdateSchema = z.object({
  order: z.array(id).max(10).optional(),
  coverId: id.optional(),
  captions: z.record(z.string(), cleanText(140)).optional(),
});
