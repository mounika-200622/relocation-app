/**
 * Runs every showcase query against the seeded database and writes docs/queries.sql with
 * the SQL plus real sample output. Statements that change data run inside a transaction
 * that is rolled back, so the script can be re-run safely.
 *
 *   npx tsx scripts/docs/queries.ts
 */
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Q = { title: string; concept: string; sql: string[]; rollback?: boolean; expectError?: boolean; note?: string };

const Q: Q[] = [
  {
    title: "Listings with their city, country and owner (3-way JOIN)",
    concept: "INNER JOIN, ORDER BY, LIMIT",
    sql: [`SELECT l.id, l.title, c.name AS city, co.isoCode AS country, u.name AS owner, l.price, l.currency
FROM Listing l
JOIN City c     ON c.id = l.cityId
JOIN Country co ON co.id = c.countryId
JOIN User u     ON u.id = l.ownerId
WHERE l.status = 'ACTIVE'
ORDER BY l.price DESC
LIMIT 5`],
  },
  {
    title: "Search cards straight from the view v_listing_summary",
    concept: "VIEW (joins + scalar sub-queries + stored function fn_spots_left)",
    sql: [`SELECT id, cityName, type, price, currency, spotsLeft, photoCount, openRequests, ownerVerified
FROM v_listing_summary
WHERE status = 'ACTIVE' AND isShareable = TRUE AND spotsLeft > 0
ORDER BY openRequests DESC, price
LIMIT 5`],
  },
  {
    title: "Cities with at least 3 active listings and their price statistics",
    concept: "GROUP BY, HAVING, aggregate functions (COUNT, AVG, MIN, MAX)",
    sql: [`SELECT c.name AS city, COUNT(*) AS listings, ROUND(AVG(l.price)) AS avg_price, MIN(l.price) AS min_price, MAX(l.price) AS max_price
FROM Listing l JOIN City c ON c.id = l.cityId
WHERE l.status = 'ACTIVE'
GROUP BY c.id, c.name
HAVING COUNT(*) >= 3
ORDER BY listings DESC`],
  },
  {
    title: "Listings cheaper than the average of their own city",
    concept: "Correlated sub-query",
    sql: [`SELECT l.id, l.title, l.price,
       (SELECT ROUND(AVG(l2.price)) FROM Listing l2 WHERE l2.cityId = l.cityId AND l2.status = 'ACTIVE') AS city_avg
FROM Listing l
WHERE l.status = 'ACTIVE'
  AND l.price < (SELECT AVG(l2.price) FROM Listing l2 WHERE l2.cityId = l.cityId AND l2.status = 'ACTIVE')
ORDER BY l.price
LIMIT 5`],
  },
  {
    title: "Rank listings by price inside each city",
    concept: "Window functions RANK() and PERCENT_RANK() with PARTITION BY",
    sql: [`SELECT c.name AS city, l.title, l.price,
       RANK() OVER (PARTITION BY l.cityId ORDER BY l.price) AS price_rank,
       ROUND(PERCENT_RANK() OVER (PARTITION BY l.cityId ORDER BY l.price) * 100) AS percentile
FROM Listing l JOIN City c ON c.id = l.cityId
WHERE l.status = 'ACTIVE' AND c.name IN ('Zürich', 'Genève')
ORDER BY city, price_rank
LIMIT 8`],
  },
  {
    title: "Nearest listings to Zürich main station",
    concept: "Stored FUNCTION fn_distance_km (Haversine) used in SELECT and ORDER BY",
    sql: [`SELECT id, title, ROUND(fn_distance_km(47.3779, 8.5403, lat, lng), 2) AS km
FROM Listing
WHERE lat IS NOT NULL
ORDER BY km
LIMIT 5`],
  },
  {
    title: "Full-text search over listing titles and descriptions",
    concept: "FULLTEXT index + MATCH … AGAINST in BOOLEAN MODE, relevance score",
    sql: [`SELECT id, title, ROUND(MATCH(title, description) AGAINST ('+balcony* +shared*' IN BOOLEAN MODE), 3) AS relevance
FROM Listing
WHERE MATCH(title, description) AGAINST ('+balcony* +shared*' IN BOOLEAN MODE)
ORDER BY relevance DESC
LIMIT 5`],
  },
  {
    title: "Full-text search over the settling-in guide",
    concept: "FULLTEXT on three columns (title, summary, body)",
    sql: [`SELECT slug, title, ROUND(MATCH(title, summary, body) AGAINST ('insurance deductible' IN NATURAL LANGUAGE MODE), 3) AS score
FROM GuideArticle
WHERE MATCH(title, summary, body) AGAINST ('insurance deductible' IN NATURAL LANGUAGE MODE)
ORDER BY score DESC`],
  },
  {
    title: "Business dashboard: views, inquiries and open requests per owner",
    concept: "LEFT JOINs to derived tables, COALESCE, GROUP BY",
    sql: [`SELECT u.name AS owner, COUNT(DISTINCT l.id) AS listings,
       COALESCE(SUM(v.views), 0) AS views, COALESCE(SUM(cv.inquiries), 0) AS inquiries, COALESCE(SUM(r.open_requests), 0) AS open_requests
FROM User u
JOIN Listing l ON l.ownerId = u.id
LEFT JOIN (SELECT listingId, COUNT(*) AS views FROM ListingView GROUP BY listingId) v ON v.listingId = l.id
LEFT JOIN (SELECT listingId, COUNT(*) AS inquiries FROM Conversation GROUP BY listingId) cv ON cv.listingId = l.id
LEFT JOIN (SELECT listingId, COUNT(*) AS open_requests FROM RoommateRequest WHERE status = 'OPEN' GROUP BY listingId) r ON r.listingId = l.id
WHERE u.role = 'BUSINESS'
GROUP BY u.id, u.name
ORDER BY views DESC`],
  },
  {
    title: "Top roommate matches for one person",
    concept: "VIEW v_roommate_compatibility (CASE-based scoring, LEFT JOIN on profiles)",
    sql: [`SELECT c.requestId, u.name AS requester, l.title AS listing, c.score
FROM v_roommate_compatibility c
JOIN User u ON u.id = c.requesterId
JOIN Listing l ON l.id = c.listingId
WHERE c.viewerId = (SELECT id FROM User WHERE email = 'aarav@nira.app')
ORDER BY c.score DESC
LIMIT 5`],
  },
  {
    title: "People who have not saved any place yet",
    concept: "NOT EXISTS anti-join",
    sql: [`SELECT u.id, u.name
FROM User u
WHERE u.role = 'USER'
  AND NOT EXISTS (SELECT 1 FROM SavedListing s WHERE s.userId = u.id)
ORDER BY u.name
LIMIT 5`],
  },
  {
    title: "Listings that have ALL of: Wi-Fi, washing machine, balcony",
    concept: "Relational division with GROUP BY … HAVING COUNT(DISTINCT …)",
    sql: [`SELECT l.id, l.title
FROM Listing l
JOIN ListingAmenity la ON la.listingId = l.id
JOIN Amenity a ON a.id = la.amenityId
WHERE a.code IN ('wifi', 'washer', 'balcony')
GROUP BY l.id, l.title
HAVING COUNT(DISTINCT a.code) = 3
LIMIT 5`],
  },
  {
    title: "Listings without any photo",
    concept: "LEFT JOIN … IS NULL",
    sql: [`SELECT l.id, l.title
FROM Listing l
LEFT JOIN ListingPhoto p ON p.listingId = l.id
WHERE p.id IS NULL`],
  },
  {
    title: "Checklist progress per user (Switzerland)",
    concept: "LEFT JOIN + conditional aggregation",
    sql: [`SELECT u.name,
       COUNT(p.itemId) AS done,
       (SELECT COUNT(*) FROM ChecklistTemplate t JOIN Country c ON c.id = t.countryId WHERE c.isoCode = 'CH') AS total
FROM User u
LEFT JOIN UserChecklistProgress p ON p.userId = u.id
WHERE u.role = 'USER'
GROUP BY u.id, u.name
ORDER BY done DESC
LIMIT 5`],
  },
  {
    title: "Typical monthly budget per Swiss city (shared room + groceries + transport + phone)",
    concept: "CTE (WITH) + pivot with SUM(CASE …)",
    sql: [`WITH monthly AS (
  SELECT ci.name AS city, ce.category, (ce.minPrice + ce.maxPrice) / 2 AS mid
  FROM CostEstimate ce JOIN City ci ON ci.id = ce.cityId
  WHERE ce.tier = 0 AND ce.category IN ('RENT_SHARED_ROOM', 'GROCERIES_MONTH', 'TRANSPORT_MONTH', 'PHONE_MONTH')
)
SELECT city,
       ROUND(SUM(CASE WHEN category = 'RENT_SHARED_ROOM' THEN mid END)) AS room,
       ROUND(SUM(CASE WHEN category = 'GROCERIES_MONTH' THEN mid END)) AS groceries,
       ROUND(SUM(CASE WHEN category = 'TRANSPORT_MONTH' THEN mid END)) AS transport,
       ROUND(SUM(mid)) AS total_chf
FROM monthly
GROUP BY city
ORDER BY total_chf DESC`],
  },
  {
    title: "Planned trip spend per category",
    concept: "GROUP BY on an enum, JOIN to the parent row",
    sql: [`SELECT i.title AS trip, it.kind, COUNT(*) AS items, SUM(it.estimatedCost) AS spent, i.budget, i.currency
FROM Itinerary i JOIN ItineraryItem it ON it.itineraryId = i.id
GROUP BY i.id, i.title, it.kind, i.budget, i.currency
ORDER BY i.id, spent DESC
LIMIT 8`],
  },
  {
    title: "Closest pharmacy to each seeded Swiss city centre",
    concept: "ROW_NUMBER() window over a computed distance",
    sql: [`SELECT city, pharmacy, km FROM (
  SELECT c.name AS city, p.name AS pharmacy, ROUND(fn_distance_km(c.lat, c.lng, p.lat, p.lng), 2) AS km,
         ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY fn_distance_km(c.lat, c.lng, p.lat, p.lng)) AS rn
  FROM City c JOIN POI p ON p.category = 'PHARMACY' AND p.lat BETWEEN c.lat - 0.05 AND c.lat + 0.05 AND p.lng BETWEEN c.lng - 0.07 AND c.lng + 0.07
  WHERE c.name IN ('Zürich', 'Genève', 'Lausanne', 'Bern')
) ranked
WHERE rn = 1`],
  },
  {
    title: "Trigger: a price change is written to AuditLog automatically",
    concept: "UPDATE + AFTER UPDATE trigger trg_listing_audit_au (rolled back)",
    rollback: true,
    sql: [
      `UPDATE Listing SET price = price + 50 WHERE id = 1`,
      `SELECT tableName, rowId, action, oldValue, newValue FROM AuditLog ORDER BY id DESC LIMIT 1`,
    ],
  },
  {
    title: "Partial unique rule: a second OPEN request by the same person is rejected",
    concept: "BEFORE INSERT trigger + UNIQUE(listingId, openRequesterId)",
    rollback: true,
    expectError: true,
    sql: [`INSERT INTO RoommateRequest (listingId, requesterId, message, updatedAt)
SELECT listingId, requesterId, 'duplicate', NOW(3) FROM RoommateRequest WHERE status = 'OPEN' LIMIT 1`],
  },
  {
    title: "CHECK constraint: occupants can never exceed capacity",
    concept: "Domain integrity enforced by the database (chk_listing_occupants)",
    rollback: true,
    expectError: true,
    sql: [`UPDATE Listing SET currentOccupants = capacityMax + 1 WHERE id = 1`],
  },
  {
    title: "Stored procedure: mark a listing rented and close its open requests",
    concept: "CALL sp_mark_listing_rented (transaction + SELECT … FOR UPDATE inside)",
    note: "The procedure commits its own transaction; this demo restores the rows afterwards.",
    sql: [
      `SET @l = (SELECT listingId FROM RoommateRequest WHERE status = 'OPEN' LIMIT 1)`,
      `SET @o = (SELECT ownerId FROM Listing WHERE id = @l)`,
      `CREATE TEMPORARY TABLE demo_open AS SELECT id FROM RoommateRequest WHERE listingId = @l AND status = 'OPEN'`,
      `CALL sp_mark_listing_rented(@l, @o, @closed)`,
      `SELECT @l AS listing, @closed AS requests_closed, (SELECT status FROM Listing WHERE id = @l) AS listing_status`,
      `UPDATE RoommateRequest SET status = 'OPEN', decidedAt = NULL WHERE id IN (SELECT id FROM demo_open)`,
      `UPDATE Listing SET status = 'ACTIVE' WHERE id = @l`,
      `DROP TEMPORARY TABLE demo_open`,
    ],
  },
  {
    title: "Accepting a roommate request: transaction with a row lock",
    concept: "START TRANSACTION, SELECT … FOR UPDATE, conditional UPDATE (race-condition guard)",
    rollback: true,
    sql: [
      `SELECT id, currentOccupants, capacityMax FROM Listing WHERE id = (SELECT listingId FROM RoommateRequest WHERE status = 'OPEN' LIMIT 1) FOR UPDATE`,
      `UPDATE RoommateRequest SET status = 'MATCHED', decidedAt = NOW(3) WHERE id = (SELECT id FROM (SELECT id FROM RoommateRequest WHERE status = 'OPEN' LIMIT 1) x)`,
      `UPDATE Listing SET currentOccupants = currentOccupants + 1 WHERE id = (SELECT listingId FROM (SELECT listingId FROM RoommateRequest WHERE status = 'MATCHED' ORDER BY decidedAt DESC LIMIT 1) y) AND currentOccupants < capacityMax`,
      `SELECT ROW_COUNT() AS rows_updated_0_means_full`,
    ],
  },
  {
    title: "Bulk upsert of cached places",
    concept: "INSERT … ON DUPLICATE KEY UPDATE on the unique osmId (rolled back)",
    rollback: true,
    sql: [
      `INSERT INTO POI (osmId, category, name, lat, lng, priceTier, lastSyncedAt)
VALUES ('node/demo-1', 'CAFE', 'Demo Café', 47.37, 8.54, 1, NOW(3)),
       ('node/demo-1', 'CAFE', 'Demo Café (renamed)', 47.37, 8.54, 2, NOW(3))
ON DUPLICATE KEY UPDATE name = VALUES(name), priceTier = VALUES(priceTier)`,
      `SELECT osmId, name, priceTier FROM POI WHERE osmId = 'node/demo-1'`,
    ],
  },
  {
    title: "Deleting a listing cascades to its photos, amenities, saves and views",
    concept: "DELETE with ON DELETE CASCADE / SET NULL (rolled back)",
    rollback: true,
    sql: [
      `SELECT (SELECT COUNT(*) FROM ListingPhoto WHERE listingId = 2) AS photos, (SELECT COUNT(*) FROM ListingAmenity WHERE listingId = 2) AS amenities, (SELECT COUNT(*) FROM ListingView WHERE listingId = 2) AS views`,
      `DELETE FROM Listing WHERE id = 2`,
      `SELECT (SELECT COUNT(*) FROM ListingPhoto WHERE listingId = 2) AS photos, (SELECT COUNT(*) FROM ListingAmenity WHERE listingId = 2) AS amenities, (SELECT COUNT(*) FROM ListingView WHERE listingId = 2) AS views`,
    ],
  },
  {
    title: "DDL: CREATE, ALTER, CREATE INDEX and DROP on a scratch table",
    concept: "Data definition statements (the real schema is created by the Prisma migrations)",
    sql: [
      `CREATE TABLE demo_wishlist (id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, note VARCHAR(100) NOT NULL, CONSTRAINT fk_demo_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE)`,
      `ALTER TABLE demo_wishlist ADD COLUMN priority TINYINT NOT NULL DEFAULT 1, ADD CONSTRAINT chk_demo_priority CHECK (priority BETWEEN 1 AND 5)`,
      `CREATE INDEX idx_demo_priority ON demo_wishlist (userId, priority)`,
      `SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'demo_wishlist' ORDER BY ORDINAL_POSITION`,
      `DROP TABLE demo_wishlist`,
    ],
  },
  {
    title: "How the search query uses the indexes",
    concept: "EXPLAIN (index on (cityId, status, price))",
    sql: [`EXPLAIN SELECT id, price FROM Listing WHERE cityId = (SELECT id FROM City WHERE name = 'Zürich' LIMIT 1) AND status = 'ACTIVE' AND price <= 1000 ORDER BY price`],
  },
  {
    title: "Global city autocomplete uses the City(name) index",
    concept: "EXPLAIN of a prefix LIKE",
    sql: [`EXPLAIN SELECT id, name FROM City WHERE name LIKE 'Zür%' LIMIT 8`],
  },
];

const fmt = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace("T", " ");
  if (typeof v === "object") return "toFixed" in (v as object) ? String(v) : JSON.stringify(v);
  return String(v);
};

function table(rows: Record<string, unknown>[]) {
  if (!rows.length) return "-- (no rows)";
  const cols = Object.keys(rows[0]!);
  const data = rows.slice(0, 8).map((r) => cols.map((c) => fmt(r[c]).slice(0, 48)));
  const w = cols.map((c, i) => Math.max(c.length, ...data.map((d) => d[i]!.length)));
  const line = (cells: string[]) => `-- | ${cells.map((c, i) => c.padEnd(w[i]!)).join(" | ")} |`;
  return [line(cols), `-- |${w.map((n) => "-".repeat(n + 2)).join("|")}|`, ...data.map(line), rows.length > 8 ? `-- … ${rows.length - 8} more rows` : ""].filter(Boolean).join("\n");
}

class Rollback extends Error {}

async function run(q: Q) {
  let last: Record<string, unknown>[] = [];
  let error: string | null = null;
  const exec = async (tx: Pick<PrismaClient, "$queryRawUnsafe" | "$executeRawUnsafe">) => {
    for (const s of q.sql) {
      if (/^\s*(SELECT|WITH|EXPLAIN)/i.test(s)) last = await tx.$queryRawUnsafe<Record<string, unknown>[]>(s);
      else await tx.$executeRawUnsafe(s);
    }
  };
  try {
    if (q.rollback) {
      await prisma.$transaction(async (tx) => {
        await exec(tx);
        throw new Rollback();
      });
    } else if (q.sql.some((s) => s.startsWith("SET @"))) {
      // session variables need one connection
      await prisma.$transaction(async (tx) => exec(tx), { timeout: 20_000 });
    } else {
      await exec(prisma);
    }
  } catch (e) {
    if (!(e instanceof Rollback)) error = (e as Error).message.split("\n").find((l) => /Error|violated|Duplicate/i.test(l))?.trim() ?? (e as Error).message.slice(0, 160);
  }
  if (error && !q.expectError) throw new Error(`Query "${q.title}" failed: ${error}`);
  return error ? `-- ✗ rejected by MySQL: ${error.replace(/\s+/g, " ")}` : table(last);
}

async function main() {
  const out: string[] = [
    "-- ============================================================================",
    "-- Nira – important queries with sample output",
    "-- Generated by `npx tsx scripts/docs/queries.ts` against the seeded database.",
    "-- Statements that change data ran inside a transaction that was rolled back.",
    "-- ============================================================================",
    "",
  ];
  for (const [i, q] of Q.entries()) {
    const result = await run(q);
    out.push(`-- ---------------------------------------------------------------------------`);
    out.push(`-- Q${i + 1}. ${q.title}`);
    out.push(`-- Concepts: ${q.concept}`);
    if (q.note) out.push(`-- Note: ${q.note}`);
    out.push(`-- ---------------------------------------------------------------------------`);
    if (q.rollback) out.push("START TRANSACTION;");
    out.push(...q.sql.map((s) => `${s};`));
    if (q.rollback) out.push("ROLLBACK;");
    out.push("-- Result:");
    out.push(result, "");
    console.log(`Q${i + 1} ok`);
  }
  fs.writeFileSync("docs/queries.sql", out.join("\n"));
  console.log(`wrote docs/queries.sql (${Q.length} queries)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
