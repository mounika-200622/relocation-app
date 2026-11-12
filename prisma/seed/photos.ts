import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { findCity } from "./locations";

type Credit = { file: string; title: string; author: string; license: string; source: string };
type Manifest = { homes: Credit[]; places: Record<string, Credit> };

/** "Author · Licence · Commons file title" – the UI turns the title into the file's Commons link. */
export const creditLine = (c: Credit) => `${c.author.slice(0, 80)} · ${c.license} · ${c.title}`.slice(0, 300);

/**
 * Real photos from Wikimedia Commons (downloaded by scripts/fetch-photos.ts):
 * cover photos for cities and countries, and room photos for demo listings that still
 * show the generated sample art. Owners' own uploads are never touched.
 */
export async function seedPhotos(prisma: PrismaClient) {
  const file = path.resolve("prisma/seed/data/photos.json");
  if (!fs.existsSync(file)) {
    console.log("  no photos.json – run npx tsx scripts/fetch-photos.ts");
    return;
  }
  const m: Manifest = JSON.parse(fs.readFileSync(file, "utf8"));

  let places = 0;
  for (const [key, c] of Object.entries(m.places)) {
    const [kind, rest] = key.split(":") as [string, string];
    if (kind === "country") {
      await prisma.country.updateMany({ where: { isoCode: rest }, data: { photoUrl: c.file, photoCredit: creditLine(c) } });
    } else {
      const city = await findCity(prisma, kind, rest).catch(() => null);
      if (!city) continue;
      await prisma.city.update({ where: { id: city.id }, data: { photoUrl: c.file, photoCredit: creditLine(c) } });
    }
    places++;
  }

  // listings whose photos are all generated sample art get 3–5 real room photos
  const listings = await prisma.listing.findMany({ orderBy: { id: "asc" }, select: { id: true, photos: { select: { storageKey: true } } } });
  let replaced = 0;
  let cursor = 0;
  for (const l of listings) {
    if (m.homes.length === 0 || (l.photos.length && !l.photos.every((p) => p.storageKey.startsWith("sample:/samples/")))) continue;
    const count = 3 + (l.id % 3);
    const picks = Array.from({ length: count }, (_, k) => m.homes[(cursor + k * 7) % m.homes.length]!);
    cursor += 3;
    await prisma.$transaction([
      prisma.listingPhoto.deleteMany({ where: { listingId: l.id, storageKey: { startsWith: "sample:/samples/" } } }),
      prisma.listingPhoto.createMany({
        data: picks.map((c, position) => ({ listingId: l.id, url: c.file, storageKey: `sample:${c.file}`, position, credit: creditLine(c) })),
      }),
    ]);
    replaced++;
  }
  console.log(`  photos: ${places} cities/countries, ${replaced} listings now use real room photos`);
}
