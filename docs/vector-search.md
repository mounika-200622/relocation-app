# Semantic search with vector embeddings

Someone who has just landed rarely knows the right word. They type *"I just landed and need
mobile internet"*, not *"SIM"*. MySQL FULLTEXT only matches words that literally appear, so it
finds nothing. Semantic search compares the **meaning** of the question with the meaning of
every article or listing instead.

Nira uses it in two places:

| Where | What the user types | What comes back |
|---|---|---|
| **Guide → Ask (meaning)** (`/guide?mode=ask`) | a question in their own words | guide articles ranked by similarity (shown as "% match") |
| **Find a place → Filters → Smart match** (`/relocate?smart=true`) | a description of the place they want | listings ranked by similarity, with every normal filter (city, price, type, spots…) still applied by MySQL |

Exact-keyword FULLTEXT search stays available as a second mode and is the automatic fallback
if the model or MongoDB is unavailable (the page says so).

## 1. What data is converted into embeddings

| Source (MySQL) | Text that is embedded |
|---|---|
| `GuideArticle` | title + summary + category + body (markdown stripped, first ~1 500 characters) |
| `Listing` | title + type + furnished / shared / pets / smoking / bills flags + city and country + address + amenity labels + description |

Structured facts (price, capacity, dates) are **not** embedded. They are exact values, and
MySQL filters them exactly. Embeddings are only used for the fuzzy, free-text part.

## 2. Embedding approach / model

* Model: **all-MiniLM-L6-v2** (sentence-transformers), 384 dimensions, ~23 MB.
* It runs **inside the Node.js process** with transformers.js (ONNX Runtime). No API key or
  paid service is needed, and no user text leaves the server.
* Mean pooling over the token vectors, then **L2 normalisation**, so every vector has length 1.
* The model is downloaded once into `./.cache/models` (git-ignored). Set `EMBEDDINGS_OFFLINE=1`
  to forbid downloads after that.

Code: [`src/lib/vector/embed.ts`](../src/lib/vector/embed.ts).

## 3. How vectors are stored

MongoDB collection **`embeddings`**, one document per embedded row:

```js
{
  _id: "listing:40",            // "<kind>:<MySQL id>", so upserts are idempotent
  kind: "listing",              // "guide" | "listing"
  refId: 40,                    // primary key of the MySQL row
  countryIso: "IE", cityId: 57566,   // metadata for pre-filtering
  text: "Bright 3-bed house with garden …",  // first 500 chars, for debugging
  textHash: "9f2c…",            // sha1 of the embedded text: unchanged rows are skipped
  model: "Xenova/all-MiniLM-L6-v2", dims: 384,
  embedding: [0.0132, -0.0841, …],   // 384 doubles
  updatedAt: ISODate("2026-11-15T12:31:02Z")
}
```

Indexes: `{kind, countryIso}`, `{kind, cityId}` (metadata pre-filter) and a unique
`{kind, refId}`.

**Why MongoDB and not MySQL:** a vector is a fixed-length float array plus loose metadata, which
fits naturally in a document. MySQL 8 has no vector type. It would need a JSON column that SQL
cannot do arithmetic on efficiently, or 384 numeric columns. MySQL stays the **source of truth**.
The vector store only holds derived data and can be rebuilt at any time with
`npm run vectors:index`.

**Keeping it in sync:** creating or editing a listing (business dashboard) or a guide article
(admin editor) re-embeds that row in the background. Deleting it removes the vector. A failure
there never blocks the save. `npm run vectors:index` re-embeds only rows whose text hash changed
and prunes vectors of rows that no longer exist.

## 4. Similarity metric

**Cosine similarity.** Because every vector is normalised, cosine similarity equals the plain
**dot product**:

cos(q, d) = (q · d) / (|q| |d|) = q · d  when |q| = |d| = 1

Scores range from −1 to 1. In practice, related texts score about 0.3–0.6 with this model.
Thresholds: guide ≥ 0.30, listings ≥ 0.30.

## 5. How relevant results are retrieved

1. The user's text is embedded with the same model (≈ 20 ms after the model is loaded).
2. **MongoDB computes the similarity itself** with an aggregation pipeline
   ([`similarityPipeline`](../src/lib/vector/store.ts)):

```js
db.embeddings.aggregate([
  { $match: { kind: "listing", model: "Xenova/all-MiniLM-L6-v2", cityId: 57566 } }, // metadata pre-filter (indexed)
  { $project: { refId: 1, score: {
      $reduce: {                                   // dot product of the two 384-d arrays
        input: { $zip: { inputs: ["$embedding", queryVector] } },
        initialValue: 0,
        in: { $add: ["$$value", { $multiply: [{ $arrayElemAt: ["$$this", 0] }, { $arrayElemAt: ["$$this", 1] }] }] }
      } } } },
  { $match: { score: { $gte: 0.3 } } },          // drop weak matches
  { $sort: { score: -1 } },
  { $limit: 200 }
])
```

3. The ids go back to **MySQL**, which applies every other filter and keeps the similarity order:

```sql
SELECT v.*, COUNT(*) OVER () AS totalCount
FROM v_listing_summary v
WHERE v.status = 'ACTIVE' AND v.price <= 900 AND v.id IN (40, 12, 55, …)
ORDER BY FIELD(v.id, 40, 12, 55, …)
LIMIT 12 OFFSET 0;
```

This is a **hybrid** query: vector similarity decides *relevance*, and relational SQL guarantees
*correctness* (only active places, the right price, open spots, and so on).

At this scale (hundreds of documents) an exact scan is fast. With millions of vectors, an
approximate-nearest-neighbour index would replace step 2: MongoDB Atlas `$vectorSearch`,
pgvector HNSW or Qdrant. The rest of the design would stay the same.

## Examples (real output)

| Query | Top results |
|---|---|
| "how do I get a phone number as a student" | Your first week in Ireland (0.39), SIM cards and mobile plans (0.33) |
| "I just landed and need mobile internet" | SIM cards and mobile data in Ireland (0.39), … in India (0.37) |
| "I got sick, where do I see a doctor" | Doctors, pharmacies and emergencies (0.34), Healthcare in India (0.31) |
| "dorm with a garden where I can bring my cat" (Dublin) | a pets-allowed dorm with a garden (0.53) ranked above ordinary flats (0.39) |

None of these queries share a keyword with the top article titles, so FULLTEXT would return
nothing for them.

## Running it

```bash
npm run vectors:index
```

Run this once after `npm run db:seed`. The first run downloads the model; after that it takes
about 40 s for all guide articles and listings, and re-runs only touch changed rows.
