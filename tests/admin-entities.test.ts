import { describe, expect, it } from "vitest";
import { ENTITIES, entityByKey, schemaFor } from "@/lib/admin-entities";

describe("admin entity registry", () => {
  it("has unique keys and a title field that exists", () => {
    const keys = ENTITIES.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const e of ENTITIES) expect(e.fields.some((f) => f.name === e.titleField)).toBe(true);
  });

  it("validates required fields and normalises empty optionals to null", () => {
    const s = schemaFor(entityByKey("emergency")!);
    expect(s.safeParse({ countryId: 1, service: "", number: "112" }).success).toBe(false);
    expect(s.parse({ countryId: "1", service: "Police", number: "117", notes: "" })).toEqual({ countryId: 1, service: "Police", number: "117", notes: null });
  });

  it("rejects bad currency codes and slugs", () => {
    const article = schemaFor(entityByKey("articles")!);
    const base = { countryId: 1, category: "BASICS", slug: "ok-slug", title: "T", summary: "S", body: "B" };
    expect(article.safeParse(base).success).toBe(true);
    expect(article.safeParse({ ...base, slug: "Not OK" }).success).toBe(false);
    const bank = schemaFor(entityByKey("banks")!);
    expect(bank.safeParse({ countryId: 1, name: "X", kind: "Y", currency: "swiss" }).success).toBe(false);
  });

  it("partial schemas allow updating a single field", () => {
    expect(schemaFor(entityByKey("costs")!, true).safeParse({ maxPrice: 20 }).success).toBe(true);
  });
});
