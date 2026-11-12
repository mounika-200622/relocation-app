/**
 * Generates docs/data-dictionary.md from the live database's information_schema, so the
 * dictionary always matches the real tables, keys, CHECK constraints and indexes.
 *
 *   npx tsx scripts/docs/data-dictionary.ts
 */
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Col = { TABLE_NAME: string; COLUMN_NAME: string; COLUMN_TYPE: string; IS_NULLABLE: string; COLUMN_DEFAULT: string | null; COLUMN_KEY: string; EXTRA: string };
type Fk = { TABLE_NAME: string; COLUMN_NAME: string; REFERENCED_TABLE_NAME: string; REFERENCED_COLUMN_NAME: string; DELETE_RULE: string };
type Chk = { TABLE_NAME: string; CONSTRAINT_NAME: string; CHECK_CLAUSE: string };
type Idx = { TABLE_NAME: string; INDEX_NAME: string; NON_UNIQUE: number | bigint; COLS: string; INDEX_TYPE: string };

// One-line purpose of every table (kept here so the doc reads well).
const PURPOSE: Record<string, string> = {
  User: "Every account (USER, BUSINESS, ADMIN). Passwords are bcrypt hashes.",
  UserProfile: "Relocation profile of a USER (1:1): destination, budget, lifestyle used for matching.",
  Language: "Language catalogue (ISO-ish codes).",
  UserLanguage: "M:N – languages a user speaks.",
  BusinessProfile: "Public profile of a BUSINESS account (1:1), verified flag set by admins.",
  PasswordResetToken: "One-time password-reset tokens (only the SHA-256 hash is stored).",
  Country: "Countries with ISO code, currency and coordinates.",
  Region: "States / cantons / provinces of a country.",
  City: "Cities, linked to country and (optionally) region.",
  Listing: "A place to live offered by a BUSINESS account.",
  ListingPhoto: "Photos of a listing (URL + storage key + order).",
  Amenity: "Amenity catalogue (wifi, washer …).",
  ListingAmenity: "M:N – amenities of a listing.",
  SavedListing: "M:N – a user's favourite listings.",
  ListingView: "One row per (listing, visitor, day) for unique daily view counts.",
  RoommateRequest: "A USER asking to share a shareable listing (OPEN → MATCHED/CLOSED/WITHDRAWN).",
  Conversation: "Chat header between two users (optionally about a listing / request). Message bodies are in MongoDB.",
  Block: "A user blocking another user (no messages either way).",
  Report: "Reports of users or listings, reviewed by admins.",
  POI: "Cached OpenStreetMap / Google places with derived price tier.",
  PoiQueryCache: "Which (area, category) place queries were fetched and when (7-day freshness).",
  CostEstimate: "Indicative prices per country/city, category and price tier.",
  ExchangeRate: "Cached currency exchange rates (24 h).",
  GuideArticle: "Settling-in guide articles (Markdown) per country/city.",
  ChecklistTemplate: "First-week checklist steps per country/city.",
  UserChecklistProgress: "M:N – which checklist steps a user ticked.",
  SimProvider: "Mobile operators / MVNOs per country.",
  SimPlan: "Plans of a SIM provider.",
  TransportMode: "How public transport works per country (train, tram …).",
  TransportPass: "Passes and tickets per country or city.",
  EmergencyNumber: "Emergency numbers per country.",
  SupermarketChain: "Supermarket chains with a price tier per country.",
  Bank: "Banks and student accounts per country.",
  Itinerary: "A generated trip plan (budget, split, style).",
  ItineraryInterest: "Multi-valued interests of an itinerary (1NF).",
  ItineraryItem: "One stop of an itinerary (day, slot, cost, place).",
  AuditLog: "Price/status history of listings, written by a trigger.",
};

async function main() {
  const db = ((await prisma.$queryRaw<{ db: string }[]>`SELECT DATABASE() AS db`)[0]!).db;
  const cols = await prisma.$queryRaw<Col[]>`SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ${db} ORDER BY TABLE_NAME, ORDINAL_POSITION`;
  const fks = await prisma.$queryRaw<Fk[]>`
    SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
    WHERE k.TABLE_SCHEMA = ${db} AND k.REFERENCED_TABLE_NAME IS NOT NULL`;
  const checks = await prisma.$queryRaw<Chk[]>`
    SELECT tc.TABLE_NAME, cc.CONSTRAINT_NAME, cc.CHECK_CLAUSE
    FROM information_schema.CHECK_CONSTRAINTS cc
    JOIN information_schema.TABLE_CONSTRAINTS tc ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
    WHERE cc.CONSTRAINT_SCHEMA = ${db} ORDER BY tc.TABLE_NAME, cc.CONSTRAINT_NAME`;
  const idx = await prisma.$queryRaw<Idx[]>`
    SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLS, INDEX_TYPE
    FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ${db}
    GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE, INDEX_TYPE ORDER BY TABLE_NAME, INDEX_NAME`;
  const views = await prisma.$queryRaw<{ TABLE_NAME: string }[]>`SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ${db}`;
  const viewNames = new Set(views.map((v) => v.TABLE_NAME));
  const fkBy = new Map(fks.map((f) => [`${f.TABLE_NAME}.${f.COLUMN_NAME}`, f]));

  const tables = [...new Set(cols.map((c) => c.TABLE_NAME))].filter((t) => t !== "_prisma_migrations" && !viewNames.has(t));
  let md = `# Data dictionary\n\nGenerated from \`information_schema\` of the migrated database (\`npx tsx scripts/docs/data-dictionary.ts\`).\n\n`;
  md += `**${tables.length} tables**, ${fks.length} foreign keys, ${checks.length} CHECK constraints, ${idx.length} indexes, ${viewNames.size} views.\n\n`;
  md += `Key: **PK** primary key · **FK → T.c (rule)** foreign key with its ON DELETE rule · **UQ** part of a unique key · **IDX** indexed.\n\n`;
  md += `## Tables\n\n${tables.map((t) => `- [${t}](#${t.toLowerCase()}) — ${PURPOSE[t] ?? ""}`).join("\n")}\n\n`;

  for (const t of tables) {
    md += `## ${t}\n\n${PURPOSE[t] ?? ""}\n\n| Column | Type | Null | Default | Keys / constraints |\n|---|---|---|---|---|\n`;
    for (const c of cols.filter((x) => x.TABLE_NAME === t)) {
      const keys: string[] = [];
      if (c.COLUMN_KEY === "PRI") keys.push("**PK**");
      const fk = fkBy.get(`${t}.${c.COLUMN_NAME}`);
      if (fk) keys.push(`FK → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME} (${fk.DELETE_RULE})`);
      if (c.COLUMN_KEY === "UNI") keys.push("UQ");
      if (c.COLUMN_KEY === "MUL" && !fk) keys.push("IDX");
      if (c.EXTRA) keys.push(c.EXTRA.replace("DEFAULT_GENERATED", "").trim() || "");
      md += `| ${c.COLUMN_NAME} | \`${c.COLUMN_TYPE}\` | ${c.IS_NULLABLE === "YES" ? "yes" : "no"} | ${c.COLUMN_DEFAULT ?? ""} | ${keys.filter(Boolean).join(", ")} |\n`;
    }
    const ix = idx.filter((i) => i.TABLE_NAME === t);
    if (ix.length) md += `\n**Indexes:** ${ix.map((i) => `\`${i.INDEX_NAME}\` (${i.COLS})${i.INDEX_TYPE === "FULLTEXT" ? " FULLTEXT" : Number(i.NON_UNIQUE) === 0 ? " unique" : ""}`).join(" · ")}\n`;
    const ck = checks.filter((c) => c.TABLE_NAME === t);
    if (ck.length) md += `\n**CHECK constraints:**\n${ck.map((c) => `- \`${c.CONSTRAINT_NAME}\`: \`${c.CHECK_CLAUSE.replace(/`/g, "")}\``).join("\n")}\n`;
    md += "\n";
  }
  md += `## Views\n\n${[...viewNames].map((v) => `- \`${v}\` – see docs/schema.sql and docs/report.md §6`).join("\n")}\n`;
  fs.writeFileSync("docs/data-dictionary.md", md);
  console.log(`wrote docs/data-dictionary.md (${tables.length} tables)`);
}

main().finally(() => prisma.$disconnect());
