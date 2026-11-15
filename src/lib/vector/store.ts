/**
 * Vector store for semantic search, kept in MongoDB (collection `embeddings`).
 *
 *   { _id: "guide:12" | "listing:40", kind, refId, countryIso, cityId,
 *     text (what was embedded, trimmed), textHash, model, dims, embedding: [384 floats], updatedAt }
 *
 * Why MongoDB: an embedding is a fixed-length float array plus loose metadata; a document
 * holds it as-is, while MySQL 8 has no vector type (it would need 384 columns or a JSON blob
 * that SQL cannot do arithmetic on efficiently).
 *
 * Retrieval: the similarity is computed *inside MongoDB* by an aggregation pipeline
 * ($match on metadata → $project dot product via $reduce/$zip → $sort → $limit). The vectors
 * are L2-normalised, so the dot product is the cosine similarity. MySQL stays the source of
 * truth: search returns ids, and the rows are loaded from MySQL with all their filters.
 */
import { createHash } from "node:crypto";
import { getDb } from "@/lib/mongo/client";
import { prisma } from "@/lib/prisma";
import { EMBEDDING_DIMS, EMBEDDING_MODEL, cleanForEmbedding, embed, embedMany } from "@/lib/vector/embed";

export type VectorKind = "guide" | "listing";

export type EmbeddingDoc = {
  _id: string;
  kind: VectorKind;
  refId: number;
  countryIso: string;
  cityId: number | null;
  text: string;
  textHash: string;
  model: string;
  dims: number;
  embedding: number[];
  updatedAt: Date;
};

export type VectorHit = { refId: number; score: number };

async function col() {
  const db = await getDb();
  return db.collection<EmbeddingDoc>("embeddings");
}

export async function ensureVectorIndexes() {
  const c = await col();
  await Promise.all([
    c.createIndex({ kind: 1, countryIso: 1 }, { name: "kind_country" }),
    c.createIndex({ kind: 1, cityId: 1 }, { name: "kind_city" }),
    c.createIndex({ kind: 1, refId: 1 }, { name: "kind_ref", unique: true }),
  ]);
}

const hash = (s: string) => createHash("sha1").update(s).digest("hex");

// ---------------------------------------------------------------- what gets embedded

export async function guideTexts(ids?: number[]) {
  const rows = await prisma.guideArticle.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    select: { id: true, title: true, summary: true, body: true, category: true, cityId: true, country: { select: { isoCode: true } } },
  });
  return rows.map((a) => ({
    kind: "guide" as const,
    refId: a.id,
    countryIso: a.country.isoCode,
    cityId: a.cityId,
    // Title and summary carry the meaning; the start of the body adds the details.
    text: cleanForEmbedding(`${a.title}. ${a.summary}. Category: ${a.category.toLowerCase()}. ${a.body}`, 1500),
  }));
}

export async function listingTexts(ids?: number[]) {
  const rows = await prisma.listing.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    select: {
      id: true, title: true, description: true, type: true, address: true, furnished: true, isShareable: true,
      petsAllowed: true, smokingAllowed: true, utilitiesIncluded: true, cityId: true,
      city: { select: { name: true, country: { select: { isoCode: true, name: true } } } },
      amenities: { select: { amenity: { select: { label: true } } } },
    },
  });
  return rows.map((l) => {
    const traits = [
      l.type.toLowerCase().replace(/_/g, " "),
      l.furnished ? "furnished" : "unfurnished",
      l.isShareable ? "shared with roommates" : "private, not shared",
      l.petsAllowed ? "pets allowed" : null,
      l.smokingAllowed ? "smoking allowed" : "non-smoking",
      l.utilitiesIncluded ? "bills included" : null,
    ].filter(Boolean).join(", ");
    const amenities = l.amenities.map((a) => a.amenity.label).join(", ");
    return {
      kind: "listing" as const,
      refId: l.id,
      countryIso: l.city.country.isoCode,
      cityId: l.cityId,
      text: cleanForEmbedding(`${l.title}. ${traits}. In ${l.city.name}, ${l.city.country.name}. ${l.address}. Amenities: ${amenities}. ${l.description ?? ""}`, 1500),
    };
  });
}

// ---------------------------------------------------------------- indexing

type Source = Awaited<ReturnType<typeof guideTexts>>[number] | Awaited<ReturnType<typeof listingTexts>>[number];

/** Embeds the sources whose text changed since the last run and upserts them. */
export async function upsertEmbeddings(sources: Source[], { batchSize = 16 } = {}) {
  const c = await col();
  const existing = await c
    .find({ _id: { $in: sources.map((s) => `${s.kind}:${s.refId}`) } }, { projection: { textHash: 1, model: 1 } })
    .toArray();
  const known = new Map(existing.map((d) => [d._id, d]));
  const todo = sources.filter((s) => {
    const prev = known.get(`${s.kind}:${s.refId}`);
    return !prev || prev.textHash !== hash(s.text) || prev.model !== EMBEDDING_MODEL;
  });

  for (let i = 0; i < todo.length; i += batchSize) {
    const batch = todo.slice(i, i + batchSize);
    const vectors = await embedMany(batch.map((s) => s.text));
    await c.bulkWrite(
      batch.map((s, j) => ({
        replaceOne: {
          filter: { _id: `${s.kind}:${s.refId}` },
          replacement: {
            kind: s.kind, refId: s.refId, countryIso: s.countryIso, cityId: s.cityId,
            text: s.text.slice(0, 500), textHash: hash(s.text), model: EMBEDDING_MODEL,
            dims: EMBEDDING_DIMS, embedding: vectors[j]!, updatedAt: new Date(),
          },
          upsert: true,
        },
      })),
    );
  }
  return { embedded: todo.length, skipped: sources.length - todo.length };
}

/** Removes vectors whose MySQL row no longer exists. */
export async function pruneEmbeddings(kind: VectorKind, liveIds: number[]) {
  const c = await col();
  const res = await c.deleteMany({ kind, refId: { $nin: liveIds } });
  return res.deletedCount;
}

/**
 * Keeps one listing's vector current after a create/edit. Fire-and-forget: a slow or
 * missing model must never break saving a listing.
 */
export function reindexListingSoon(listingId: number) {
  void listingTexts([listingId])
    .then((src) => upsertEmbeddings(src))
    .catch((err) => console.warn("[vectors] listing reindex skipped:", (err as Error).message));
}

export function reindexGuideSoon(articleId: number) {
  void guideTexts([articleId])
    .then((src) => upsertEmbeddings(src))
    .catch((err) => console.warn("[vectors] guide reindex skipped:", (err as Error).message));
}

export async function deleteEmbedding(kind: VectorKind, refId: number) {
  try {
    await (await col()).deleteOne({ _id: `${kind}:${refId}` });
  } catch (err) {
    console.warn("[vectors] delete skipped:", (err as Error).message);
  }
}

// ---------------------------------------------------------------- retrieval

/**
 * The MongoDB aggregation that ranks documents by cosine similarity to `query`.
 * Exported separately so the documentation and tests can show the exact pipeline.
 */
export function similarityPipeline(
  query: number[],
  match: Record<string, unknown>,
  { limit = 20, minScore = 0.2 } = {},
) {
  return [
    { $match: match },
    {
      $project: {
        refId: 1,
        score: {
          $reduce: {
            input: { $zip: { inputs: ["$embedding", { $literal: query }] } },
            initialValue: 0,
            in: { $add: ["$$value", { $multiply: [{ $arrayElemAt: ["$$this", 0] }, { $arrayElemAt: ["$$this", 1] }] }] },
          },
        },
      },
    },
    { $match: { score: { $gte: minScore } } },
    { $sort: { score: -1 } },
    { $limit: limit },
  ];
}

export async function semanticSearch(
  kind: VectorKind,
  text: string,
  filter: { countryIso?: string; cityId?: number } = {},
  opts: { limit?: number; minScore?: number } = {},
): Promise<VectorHit[]> {
  const query = await embed(text);
  const match: Record<string, unknown> = { kind, model: EMBEDDING_MODEL };
  if (filter.countryIso) match.countryIso = filter.countryIso;
  if (filter.cityId) match.cityId = filter.cityId;
  const c = await col();
  const rows = await c.aggregate<{ refId: number; score: number }>(similarityPipeline(query, match, opts)).toArray();
  return rows.map((r) => ({ refId: r.refId, score: r.score }));
}
