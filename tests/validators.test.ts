import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validators/auth";
import { listingCreateSchema, listingSearchSchema } from "@/lib/validators/listing";
import { sendMessageSchema, startChatSchema } from "@/lib/validators/social";
import { tripCreateSchema } from "@/lib/validators/trip";

const validListing = { title: "Sunny room", type: "DORM", address: "Langstrasse 10", cityId: 1, price: 900, currency: "chf" };

describe("signupSchema", () => {
  it("accepts a valid USER signup and lowercases the email", () => {
    const r = signupSchema.parse({ name: "Ana", email: "Ana@Example.COM ", password: "longenough", role: "USER" });
    expect(r.email).toBe("ana@example.com");
  });
  it("rejects ADMIN self-assignment", () => {
    expect(signupSchema.safeParse({ name: "Eve", email: "e@x.ch", password: "longenough", role: "ADMIN" }).success).toBe(false);
  });
  it("enforces the 8-character minimum", () => {
    const r = signupSchema.safeParse({ name: "Ana", email: "a@x.ch", password: "short", role: "USER" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/8 characters/);
  });
});

describe("listingCreateSchema", () => {
  it("normalises currency and fills defaults", () => {
    const r = listingCreateSchema.parse(validListing);
    expect(r.currency).toBe("CHF");
    expect(r.genderPreference).toBe("ANYONE");
    expect(r.capacityMax).toBe(1);
  });
  it("mirrors the capacity CHECK constraint", () => {
    expect(listingCreateSchema.safeParse({ ...validListing, capacityMin: 3, capacityMax: 2 }).success).toBe(false);
    expect(listingCreateSchema.safeParse({ ...validListing, capacityMax: 2, currentOccupants: 3 }).success).toBe(false);
  });
  it("rejects a zero price and unknown types", () => {
    expect(listingCreateSchema.safeParse({ ...validListing, price: 0 }).success).toBe(false);
    expect(listingCreateSchema.safeParse({ ...validListing, type: "CASTLE" }).success).toBe(false);
  });
});

describe("listingSearchSchema", () => {
  it("parses query strings leniently", () => {
    const r = listingSearchSchema.parse({ cityId: "5", maxPrice: "1200", shareable: "true", amenities: "1,2,x", sort: "bogus", page: "-3" });
    expect(r).toMatchObject({ cityId: 5, maxPrice: 1200, shareable: true, amenities: [1, 2], sort: "newest", page: 1 });
  });
  it("treats empty values as unset", () => {
    expect(listingSearchSchema.parse({ cityId: "", minPrice: "" })).toMatchObject({ cityId: undefined, minPrice: undefined });
  });
});

describe("chat validators", () => {
  it("limits messages to 2000 characters and trims", () => {
    expect(sendMessageSchema.parse({ text: "  hi  " }).text).toBe("hi");
    expect(sendMessageSchema.safeParse({ text: "x".repeat(2001) }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ text: "   " }).success).toBe(false);
  });
  it("needs someone to talk to", () => {
    expect(startChatSchema.safeParse({}).success).toBe(false);
    expect(startChatSchema.safeParse({ listingId: 3 }).success).toBe(true);
  });
});

describe("tripCreateSchema", () => {
  it("requires the split to add up to 100", () => {
    const base = { cityId: 1, days: 3, people: 2, budget: 900, currency: "CHF" };
    expect(tripCreateSchema.safeParse({ ...base, split: { stay: 50, food: 30, activities: 10, transport: 5 } }).success).toBe(false);
    expect(tripCreateSchema.safeParse({ ...base, split: { stay: 50, food: 30, activities: 10, transport: 10 } }).success).toBe(true);
  });
  it("caps trips at 30 days", () => {
    expect(tripCreateSchema.safeParse({ cityId: 1, days: 31, people: 1, budget: 100, currency: "EUR" }).success).toBe(false);
  });
});
