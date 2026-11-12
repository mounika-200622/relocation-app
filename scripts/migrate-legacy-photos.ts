/**
 * One-time data migration: v1 stored photos as a JSON array of base64 data URLs in
 * Listing.photos (renamed to legacyPhotos by the v2 migration). This moves every image
 * into storage + the ListingPhoto table, then clears legacyPhotos.
 *
 *   npm run photos:migrate            (safe to re-run: done rows have legacyPhotos = NULL)
 */
import { PrismaClient } from "@prisma/client";
import { MAX_PHOTO_BYTES, savePhoto, sniffImage } from "../src/lib/storage";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.listing.findMany({ where: { legacyPhotos: { not: null } }, select: { id: true, legacyPhotos: true } });
  console.log(`listings with legacy photos: ${rows.length}`);
  let moved = 0;
  let skipped = 0;

  for (const row of rows) {
    let list: unknown;
    try {
      list = JSON.parse(row.legacyPhotos ?? "[]");
    } catch {
      list = [];
    }
    const items = Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
    let position = await prisma.listingPhoto.count({ where: { listingId: row.id } });

    for (const item of items) {
      if (position >= 10) break;
      if (/^https?:\/\//.test(item)) {
        // already hosted somewhere: keep the URL as is
        await prisma.listingPhoto.create({ data: { listingId: row.id, url: item, storageKey: `external:${item.slice(0, 200)}`, position: position++ } });
        moved++;
        continue;
      }
      const match = item.match(/^data:image\/[a-z+]+;base64,(.+)$/);
      if (!match) {
        skipped++;
        continue;
      }
      const buf = Buffer.from(match[1]!, "base64");
      const kind = sniffImage(buf);
      if (!kind || buf.length > MAX_PHOTO_BYTES) {
        skipped++;
        continue;
      }
      const stored = await savePhoto(buf, kind, `listings/${row.id}`);
      await prisma.listingPhoto.create({ data: { listingId: row.id, url: stored.url, storageKey: stored.storageKey, position: position++ } });
      moved++;
    }
    await prisma.listing.update({ where: { id: row.id }, data: { legacyPhotos: null } });
  }
  console.log(`moved ${moved} photos, skipped ${skipped} invalid entries`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
