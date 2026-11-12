import { z } from "zod";
import { cleanText, dateString, id, optionalId, qNum } from "@/lib/validators/common";

export const roommateRequestSchema = z.object({
  message: cleanText(600).pipe(z.string().min(10, "Say a little about yourself (at least 10 characters).")),
  moveInDate: dateString.nullable().optional(),
  budgetShare: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
});

export const requestActionSchema = z.object({ action: z.enum(["accept", "decline", "withdraw"]) });

export const roommateSearchSchema = z.object({
  cityId: optionalId,
  minBudget: qNum(),
  maxBudget: qNum(),
  moveInFrom: dateString.optional().catch(undefined),
  moveInTo: dateString.optional().catch(undefined),
  gender: z.enum(["FEMALE", "MALE", "NON_BINARY"]).optional().catch(undefined),
  smoking: z.enum(["NON_SMOKER", "OUTSIDE_ONLY", "SMOKER"]).optional().catch(undefined),
  pets: z.enum(["yes", "no"]).optional().catch(undefined),
});

export const MESSAGE_MAX = 2000;
export const sendMessageSchema = z.object({
  text: cleanText(MESSAGE_MAX).pipe(z.string().min(1, "Message can't be empty.")),
});

export const startChatSchema = z
  .object({
    otherUserId: id.optional(),
    listingId: id.optional(),
    requestId: id.optional(),
    text: cleanText(MESSAGE_MAX).optional(),
  })
  .refine((v) => v.otherUserId || v.listingId || v.requestId, "Say who you want to message.");

export const reportSchema = z
  .object({
    reportedUserId: id.optional(),
    listingId: id.optional(),
    reason: z.enum(["SCAM", "SPAM", "HARASSMENT", "INAPPROPRIATE", "FAKE_LISTING", "OTHER"]),
    details: cleanText(1000).optional(),
  })
  .refine((v) => v.reportedUserId || v.listingId, "Choose a user or a listing to report.");
