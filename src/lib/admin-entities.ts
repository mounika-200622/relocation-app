import { z } from "zod";

/**
 * Registry of admin-editable content tables. The same field list drives the zod
 * validation on the server and the generic editor form in /admin/content.
 */
export type FieldType = "text" | "textarea" | "number" | "money" | "bool" | "country" | "select";
export type FieldDef = { name: string; label: string; type: FieldType; required?: boolean; options?: string[]; max?: number };
export type EntityDef = { key: string; label: string; model: string; fields: FieldDef[]; titleField: string; orderBy: Record<string, "asc" | "desc">[] };

const country: FieldDef = { name: "countryId", label: "Country", type: "country", required: true };
const GUIDE_CATS = ["BASICS", "HOUSING", "HEALTHCARE", "MONEY", "GROCERIES", "TRANSPORT", "SIM", "LEGAL", "CULTURE"];

export const ENTITIES: EntityDef[] = [
  {
    key: "articles", label: "Guide articles", model: "guideArticle", titleField: "title", orderBy: [{ countryId: "asc" }, { position: "asc" }],
    fields: [country, { name: "category", label: "Category", type: "select", options: GUIDE_CATS, required: true }, { name: "slug", label: "Slug", type: "text", required: true, max: 120 },
      { name: "title", label: "Title", type: "text", required: true, max: 160 }, { name: "summary", label: "Summary", type: "textarea", required: true, max: 400 },
      { name: "body", label: "Body (Markdown)", type: "textarea", required: true, max: 20000 }, { name: "sourceName", label: "Source", type: "text", max: 120 },
      { name: "sourceUrl", label: "Source URL", type: "text", max: 300 }, { name: "position", label: "Order", type: "number" }],
  },
  {
    key: "checklist", label: "Checklist steps", model: "checklistTemplate", titleField: "title", orderBy: [{ countryId: "asc" }, { position: "asc" }],
    fields: [country, { name: "category", label: "Category", type: "select", options: GUIDE_CATS, required: true }, { name: "title", label: "Title", type: "text", required: true, max: 160 },
      { name: "description", label: "Description", type: "textarea", required: true, max: 600 }, { name: "dueWithinDays", label: "Due within (days)", type: "number" },
      { name: "link", label: "Official link", type: "text", max: 300 }, { name: "position", label: "Order", type: "number" }],
  },
  {
    key: "sim-providers", label: "SIM providers", model: "simProvider", titleField: "name", orderBy: [{ countryId: "asc" }, { name: "asc" }],
    fields: [country, { name: "name", label: "Name", type: "text", required: true, max: 80 }, { name: "isMvno", label: "MVNO", type: "bool" }, { name: "network", label: "Network", type: "text", max: 80 },
      { name: "website", label: "Website", type: "text", max: 200 }, { name: "whereToBuy", label: "Where to buy", type: "text", required: true, max: 300 },
      { name: "documentsNeeded", label: "Documents needed", type: "text", required: true, max: 300 }, { name: "studentTip", label: "Student tip", type: "text", max: 300 }, { name: "touristTip", label: "Tourist tip", type: "text", max: 300 }],
  },
  {
    key: "sim-plans", label: "SIM plans", model: "simPlan", titleField: "name", orderBy: [{ providerId: "asc" }, { priceMonthly: "asc" }],
    fields: [{ name: "providerId", label: "Provider id", type: "number", required: true }, { name: "name", label: "Plan", type: "text", required: true, max: 100 },
      { name: "kind", label: "Kind", type: "select", options: ["PREPAID", "POSTPAID"], required: true }, { name: "priceMonthly", label: "Price / month", type: "money", required: true },
      { name: "currency", label: "Currency", type: "text", required: true, max: 3 }, { name: "dataGb", label: "Data GB (blank = unlimited)", type: "money" },
      { name: "euRoaming", label: "EU roaming", type: "bool" }, { name: "notes", label: "Notes", type: "text", max: 300 }],
  },
  {
    key: "transport-modes", label: "Transport modes", model: "transportMode", titleField: "title", orderBy: [{ countryId: "asc" }, { position: "asc" }],
    fields: [country, { name: "mode", label: "Mode", type: "select", options: ["TRAIN", "TRAM", "BUS", "METRO", "BOAT", "CABLE_CAR", "BIKE", "WALK"], required: true },
      { name: "title", label: "Title", type: "text", required: true, max: 100 }, { name: "description", label: "Description", type: "textarea", required: true, max: 1000 },
      { name: "howToBuy", label: "How to buy", type: "textarea", max: 600 }, { name: "apps", label: "Apps", type: "text", max: 200 }, { name: "priceRange", label: "Price range", type: "text", max: 120 }, { name: "position", label: "Order", type: "number" }],
  },
  {
    key: "transport-passes", label: "Transport passes", model: "transportPass", titleField: "name", orderBy: [{ countryId: "asc" }, { price: "asc" }],
    fields: [country, { name: "name", label: "Name", type: "text", required: true, max: 100 }, { name: "description", label: "Description", type: "textarea", required: true, max: 600 },
      { name: "price", label: "Price", type: "money" }, { name: "currency", label: "Currency", type: "text", required: true, max: 3 }, { name: "validity", label: "Validity", type: "text", required: true, max: 80 },
      { name: "audience", label: "Audience", type: "select", options: ["EVERYONE", "YOUTH", "STUDENT", "TOURIST", "SENIOR"], required: true }, { name: "url", label: "URL", type: "text", max: 300 }],
  },
  {
    key: "rides", label: "Taxis & ride-hailing", model: "rideService", titleField: "name", orderBy: [{ countryId: "asc" }, { position: "asc" }],
    fields: [country, { name: "name", label: "Name", type: "text", required: true, max: 80 }, { name: "kind", label: "Kind", type: "select", options: ["RIDE_HAILING", "TAXI", "BIKE_SHARE", "SCOOTER"], required: true },
      { name: "website", label: "Website", type: "text", max: 200 }, { name: "deepLink", label: "App link template ({lat} {lng} {name})", type: "text", max: 400 },
      { name: "phone", label: "Phone", type: "text", max: 30 }, { name: "notes", label: "Notes", type: "text", max: 300 }, { name: "position", label: "Order", type: "number" }],
  },
  {
    key: "emergency", label: "Emergency numbers", model: "emergencyNumber", titleField: "service", orderBy: [{ countryId: "asc" }],
    fields: [country, { name: "service", label: "Service", type: "text", required: true, max: 60 }, { name: "number", label: "Number", type: "text", required: true, max: 20 }, { name: "notes", label: "Notes", type: "text", max: 200 }],
  },
  {
    key: "supermarkets", label: "Supermarkets", model: "supermarketChain", titleField: "name", orderBy: [{ countryId: "asc" }, { priceTier: "asc" }],
    fields: [country, { name: "name", label: "Name", type: "text", required: true, max: 80 }, { name: "priceTier", label: "Price tier (1-4)", type: "number", required: true },
      { name: "notes", label: "Notes", type: "text", max: 300 }, { name: "website", label: "Website", type: "text", max: 200 }],
  },
  {
    key: "banks", label: "Banks", model: "bank", titleField: "name", orderBy: [{ countryId: "asc" }, { name: "asc" }],
    fields: [country, { name: "name", label: "Name", type: "text", required: true, max: 80 }, { name: "kind", label: "Kind", type: "text", required: true, max: 40 },
      { name: "studentAccount", label: "Student account", type: "bool" }, { name: "monthlyFee", label: "Monthly fee", type: "money" }, { name: "currency", label: "Currency", type: "text", required: true, max: 3 },
      { name: "notes", label: "Notes", type: "text", max: 300 }, { name: "website", label: "Website", type: "text", max: 200 }],
  },
  {
    key: "costs", label: "Cost estimates", model: "costEstimate", titleField: "category", orderBy: [{ countryId: "asc" }, { cityId: "asc" }, { category: "asc" }, { tier: "asc" }],
    fields: [country, { name: "cityId", label: "City id (blank = whole country)", type: "number" },
      { name: "category", label: "Category", type: "select", options: ["RENT_SHARED_ROOM", "RENT_STUDIO", "RENT_ONE_BEDROOM", "GROCERIES_MONTH", "TRANSPORT_MONTH", "TRANSPORT_DAY", "PHONE_MONTH", "MEAL", "COFFEE", "STAY_NIGHT", "ATTRACTION_ENTRY"], required: true },
      { name: "tier", label: "Tier (0 = none, 1-4)", type: "number", required: true }, { name: "minPrice", label: "Min", type: "money", required: true }, { name: "maxPrice", label: "Max", type: "money", required: true },
      { name: "currency", label: "Currency", type: "text", required: true, max: 3 }, { name: "source", label: "Source", type: "text", max: 200 }],
  },
];

export const entityByKey = (key: string) => ENTITIES.find((e) => e.key === key) ?? null;

/** Builds a zod schema from the field list (partial for updates). */
export function schemaFor(def: EntityDef, partial = false) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of def.fields) {
    let s: z.ZodType;
    switch (f.type) {
      case "bool":
        s = z.boolean();
        break;
      case "number":
      case "country":
        s = z.coerce.number().int().min(0).max(1_000_000_000);
        break;
      case "money":
        s = z.coerce.number().min(0).max(100_000_000);
        break;
      case "select":
        s = z.enum(f.options as [string, ...string[]]);
        break;
      default:
        s = z.string().trim().max(f.max ?? 1000);
        if (f.name === "currency") s = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code.");
        if (f.name === "slug") s = z.string().regex(/^[a-z0-9-]{1,120}$/, "Lowercase letters, digits and dashes only.");
        if (f.required) s = (s as z.ZodString).min(1, `${f.label} is required.`);
    }
    // empty optional fields become NULL
    const optional = !f.required || partial;
    shape[f.name] = optional ? z.preprocess((v) => (v === "" || v === undefined ? null : v), s.nullable().optional()) : s;
  }
  return z.object(shape);
}
