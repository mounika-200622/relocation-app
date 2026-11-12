/**
 * Idempotent seed: safe to run any number of times (`npm run db:seed`).
 *   1. locations   – all countries, regions and cities (country-state-city)
 *   2. reference   – amenities, languages, emergency numbers
 *   3. guide       – complete Swiss settling-in content
 *   4. costs       – cost estimates for 10 Swiss cities + 12 countries
 *   5. demo        – admins, businesses, users, listings, requests, chats
 *   6. trips       – sample itineraries (uses cached places when available)
 */
import { PrismaClient } from "@prisma/client";
import { seedLocations } from "./seed/locations";
import { seedReference } from "./seed/reference";
import { seedSwissGuide } from "./seed/guide-ch";
import { seedCosts } from "./seed/costs";
import { seedDemo } from "./seed/demo";
import { seedTrips } from "./seed/trips";

const prisma = new PrismaClient();

async function step(name: string, fn: () => Promise<void>) {
  const t = Date.now();
  console.log(`▸ ${name}`);
  await fn();
  console.log(`  done in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}

async function main() {
  await step("locations", () => seedLocations(prisma));
  await step("reference data", () => seedReference(prisma));
  await step("Swiss guide", () => seedSwissGuide(prisma));
  await step("cost estimates", () => seedCosts(prisma));
  await step("demo data", () => seedDemo(prisma));
  await step("sample trips", () => seedTrips(prisma));
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
