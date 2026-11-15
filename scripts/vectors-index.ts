/**
 * Builds / refreshes the semantic-search vectors in MongoDB.
 *
 *   npm run vectors:index
 *
 * Embeds every guide article and every listing (only rows whose text changed since the
 * last run), removes vectors of deleted rows, and makes sure the indexes exist.
 * The first run downloads the embedding model (~23 MB) into ./.cache/models.
 */
try {
  process.loadEnvFile(".env");
} catch {
  // no .env: rely on the real environment
}
import { prisma } from "@/lib/prisma";
import { ensureVectorIndexes, guideTexts, listingTexts, pruneEmbeddings, upsertEmbeddings } from "@/lib/vector/store";

async function main() {
  const t0 = Date.now();
  await ensureVectorIndexes();

  const guides = await guideTexts();
  const g = await upsertEmbeddings(guides);
  const gPruned = await pruneEmbeddings("guide", guides.map((s) => s.refId));
  console.log(`guide articles: ${g.embedded} embedded, ${g.skipped} unchanged, ${gPruned} removed`);

  const listings = await listingTexts();
  const l = await upsertEmbeddings(listings);
  const lPruned = await pruneEmbeddings("listing", listings.map((s) => s.refId));
  console.log(`listings:       ${l.embedded} embedded, ${l.skipped} unchanged, ${lPruned} removed`);

  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
