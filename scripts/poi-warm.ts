/**
 * Pre-fills the POI cache (MySQL) for the given cities so demos don't depend on a slow
 * public Overpass server. Queries run one at a time, with the provider's own backoff.
 *
 *   npx tsx scripts/poi-warm.ts                 # the 10 Swiss demo cities + Dublin + Bengaluru
 *   npx tsx scripts/poi-warm.ts Berlin:DE Bern:CH
 *   npx tsx scripts/poi-warm.ts "Dublin:IE@53.3067,-6.2210"   # around a point, e.g. the UCD campus
 */
import { PrismaClient, type PoiCategory } from "@prisma/client";
import { ensureCached, resetPrimaryCooldown } from "../src/lib/poi/service";
import { ESSENTIAL_GROUPS, TRIP_FOOD, TRIP_RADIUS, TRIP_SIGHTS_CULTURE, TRIP_SIGHTS_OUTDOOR, TRIP_STAY } from "../src/lib/poi/categories";

try {
  process.loadEnvFile(".env"); // OVERPASS_URL mirrors etc.
} catch {
  /* no .env */
}
// Unlike a page request, nobody is waiting: give each map server up to 90 s.
process.env.OVERPASS_TIMEOUT_MS ??= "90000";
const prisma = new PrismaClient();
const DEFAULT = ["Zürich:CH", "Genève:CH", "Lausanne:CH", "Basel:CH", "Bern:CH", "Luzern:CH", "Lugano:CH", "Sankt Gallen:CH", "Fribourg:CH", "Zug:CH", "Dublin:IE", "Bengaluru:IN"];

const JOBS: { label: string; categories: PoiCategory[]; radius: number }[] = [
  { label: "stays", categories: TRIP_STAY, radius: TRIP_RADIUS.stay },
  { label: "culture", categories: TRIP_SIGHTS_CULTURE, radius: TRIP_RADIUS.sights },
  { label: "outdoor", categories: TRIP_SIGHTS_OUTDOOR, radius: TRIP_RADIUS.sights },
  { label: "food", categories: TRIP_FOOD, radius: TRIP_RADIUS.food },
  ...Object.entries(ESSENTIAL_GROUPS)
    .filter(([k]) => k !== "food")
    .map(([k, g]) => ({ label: k, categories: [...g.categories] as PoiCategory[], radius: 1500 })),
];

async function main() {
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
  for (const t of targets) {
    // "Dublin:IE" warms around the city centre; "Dublin:IE@53.3067,-6.2210" around a point (e.g. a campus)
    const [place, at] = t.split("@");
    const [name, iso] = place!.split(":");
    const row = await prisma.city.findFirst({ where: { name, country: { isoCode: iso } }, orderBy: { lat: "desc" }, select: { id: true, lat: true, lng: true } });
    const [atLat, atLng] = (at ?? "").split(",").map(Number);
    const city = row && at && Number.isFinite(atLat) && Number.isFinite(atLng) ? { id: row.id, lat: atLat!, lng: atLng! } : row;
    if (!city?.lat || !city.lng) {
      console.log(`skip ${t}: no coordinates`);
      continue;
    }
    for (const job of JOBS) {
      const t0 = Date.now();
      // A batch job can wait: retry a failed area up to 3 times, pausing in between.
      let r = await ensureCached({ lat: city.lat, lng: city.lng }, job.radius, job.categories, city.id);
      for (let attempt = 1; r.stale && attempt <= 3; attempt++) {
        await new Promise((ok) => setTimeout(ok, 5000 * attempt));
        resetPrimaryCooldown();
        r = await ensureCached({ lat: city.lat, lng: city.lng }, job.radius, job.categories, city.id);
      }
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
