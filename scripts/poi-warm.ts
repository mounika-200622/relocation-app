/**
 * Pre-fills the POI cache (MySQL) for the given cities so demos don't depend on a slow
 * public Overpass server. Queries run one at a time, with the provider's own backoff.
 *
 *   npx tsx scripts/poi-warm.ts                 # the 10 seeded Swiss cities
 *   npx tsx scripts/poi-warm.ts Berlin:DE Bern:CH
 */
import { PrismaClient, type PoiCategory } from "@prisma/client";
import { ensureCached } from "../src/lib/poi/service";
import { ESSENTIAL_GROUPS, TRIP_FOOD, TRIP_SIGHTS, TRIP_STAY } from "../src/lib/poi/categories";

const prisma = new PrismaClient();
const DEFAULT = ["Zürich:CH", "Genève:CH", "Lausanne:CH", "Basel:CH", "Bern:CH", "Luzern:CH", "Lugano:CH", "Sankt Gallen:CH", "Fribourg:CH", "Zug:CH"];

const JOBS: { label: string; categories: PoiCategory[]; radius: number }[] = [
  { label: "stays", categories: TRIP_STAY, radius: 3000 },
  { label: "sights", categories: TRIP_SIGHTS, radius: 3000 },
  { label: "food", categories: TRIP_FOOD, radius: 1500 },
  ...Object.entries(ESSENTIAL_GROUPS)
    .filter(([k]) => k !== "food")
    .map(([k, g]) => ({ label: k, categories: [...g.categories] as PoiCategory[], radius: 1500 })),
];

async function main() {
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
  for (const t of targets) {
    const [name, iso] = t.split(":");
    const city = await prisma.city.findFirst({ where: { name, country: { isoCode: iso } }, select: { id: true, lat: true, lng: true } });
    if (!city?.lat || !city.lng) {
      console.log(`skip ${t}: no coordinates`);
      continue;
    }
    for (const job of JOBS) {
      const t0 = Date.now();
      const r = await ensureCached({ lat: city.lat, lng: city.lng }, job.radius, job.categories, city.id);
      console.log(`${name.padEnd(13)} ${job.label.padEnd(10)} ${r.stale ? "FAILED" : `+${r.fetched}`} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
