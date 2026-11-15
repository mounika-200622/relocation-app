/**
 * Local text embeddings for semantic search.
 *
 * Model: all-MiniLM-L6-v2 (sentence-transformers, 384 dimensions) run in-process with
 * transformers.js / ONNX Runtime — no API key, no external service at query time.
 * The model (~23 MB) is downloaded once into ./.cache/models and reused.
 *
 * Every vector is mean-pooled and L2-normalised, so cosine similarity = dot product.
 */
import path from "node:path";

export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIMS = 384;

type Extractor = (text: string | string[], opts: { pooling: "mean"; normalize: boolean }) => Promise<{ tolist(): number[][] }>;

const globalForEmbed = globalThis as unknown as { niraExtractor?: Promise<Extractor> };

async function load(): Promise<Extractor> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.cacheDir = path.resolve(process.cwd(), ".cache", "models");
  env.allowLocalModels = true;
  // Offline demos: set EMBEDDINGS_OFFLINE=1 after the model has been downloaded once.
  if (process.env.EMBEDDINGS_OFFLINE === "1") env.allowRemoteModels = false;
  return (await pipeline("feature-extraction", EMBEDDING_MODEL, { dtype: "fp32" })) as unknown as Extractor;
}

function extractor(): Promise<Extractor> {
  if (!globalForEmbed.niraExtractor) {
    globalForEmbed.niraExtractor = load().catch((err) => {
      globalForEmbed.niraExtractor = undefined; // retry on the next call
      throw err;
    });
  }
  return globalForEmbed.niraExtractor;
}

/** Collapses whitespace and strips markdown symbols so the model sees plain prose. */
export function cleanForEmbedding(text: string, maxChars = 2000) {
  return text
    .replace(/[#*_`>|[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

export async function embed(text: string): Promise<number[]> {
  const [vec] = await embedMany([text]);
  return vec!;
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const fx = await extractor();
  const out = await fx(texts.map((t) => cleanForEmbedding(t)), { pooling: "mean", normalize: true });
  return out.tolist();
}

/** Plain cosine similarity (used by tests and as a reference for the Mongo pipeline). */
export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
