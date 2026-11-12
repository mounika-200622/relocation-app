import { z } from "zod";

export const id = z.coerce.number().int().positive();
export const optionalId = z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().int().positive().optional());
export const money = z.coerce.number().min(0, "Must be zero or more.").max(10_000_000, "That amount is too large.");
export const currency = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code.");
export const lat = z.coerce.number().min(-90).max(90);
export const lng = z.coerce.number().min(-180).max(180);
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD.")
  .refine((s) => !Number.isNaN(Date.parse(s)), "That date doesn't exist.");

/** Query-string booleans: "true"/"1" → true, anything else/missing → undefined. */
export const qBool = z.preprocess((v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : undefined), z.boolean().optional());
export const qNum = (min = 0, max = 10_000_000) => z.preprocess((v) => (v === "" || v === undefined ? undefined : v), z.coerce.number().min(min).max(max).optional());

/** Strips control characters and trims; keeps normal punctuation and emoji. */
export const cleanText = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().max(max, `Keep it under ${max} characters.`));
