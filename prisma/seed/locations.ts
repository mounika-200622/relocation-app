import type { PrismaClient } from "@prisma/client";
import { City as CscCity, Country as CscCountry, State as CscState } from "country-state-city";

/**
 * Loads Country → Region → City from the `country-state-city` dataset.
 * Idempotent: countries/regions are upserted by ISO code, cities use createMany with
 * skipDuplicates against UNIQUE(countryId, regionId, name).
 *
 * SEED_COUNTRIES=CH,IN,DE limits the city load (all countries and regions are still loaded).
 */
const BATCH = 2_000;

const toFloat = (s: string | null | undefined) => {
  const n = Number.parseFloat(s ?? "");
  return Number.isFinite(n) ? n : null;
};

export async function seedLocations(prisma: PrismaClient) {
  const only = (process.env.SEED_COUNTRIES ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const countries = CscCountry.getAllCountries();
  console.log(`  countries: ${countries.length}`);
  const countryId = new Map<string, number>();
  for (const c of countries) {
    const row = await prisma.country.upsert({
      where: { isoCode: c.isoCode },
      update: { name: c.name, currency: (c.currency || "USD").slice(0, 3), phoneCode: c.phonecode || null, flag: c.flag || null, lat: toFloat(c.latitude), lng: toFloat(c.longitude) },
      create: { isoCode: c.isoCode, name: c.name, currency: (c.currency || "USD").slice(0, 3), phoneCode: c.phonecode || null, flag: c.flag || null, lat: toFloat(c.latitude), lng: toFloat(c.longitude) },
      select: { id: true },
    });
    countryId.set(c.isoCode, row.id);
  }

  const states = CscState.getAllStates();
  console.log(`  regions: ${states.length}`);
  await prisma.region.createMany({
    data: states
      .filter((s) => countryId.has(s.countryCode))
      .map((s) => ({ countryId: countryId.get(s.countryCode)!, isoCode: s.isoCode.slice(0, 10), name: s.name.slice(0, 120), lat: toFloat(s.latitude), lng: toFloat(s.longitude) })),
    skipDuplicates: true,
  });
  const regionRows = await prisma.region.findMany({ select: { id: true, isoCode: true, country: { select: { isoCode: true } } } });
  const regionId = new Map(regionRows.map((r) => [`${r.country.isoCode}:${r.isoCode}`, r.id]));

  const cities = CscCity.getAllCities().filter((c) => only.length === 0 || only.includes(c.countryCode));
  console.log(`  cities: ${cities.length}${only.length ? ` (limited to ${only.join(",")})` : ""}`);
  let inserted = 0;
  for (let i = 0; i < cities.length; i += BATCH) {
    const chunk = cities.slice(i, i + BATCH);
    const r = await prisma.city.createMany({
      data: chunk
        .filter((c) => countryId.has(c.countryCode))
        .map((c) => ({
          countryId: countryId.get(c.countryCode)!,
          regionId: regionId.get(`${c.countryCode}:${c.stateCode}`) ?? null,
          name: c.name.slice(0, 120),
          lat: toFloat(c.latitude),
          lng: toFloat(c.longitude),
        })),
      skipDuplicates: true,
    });
    inserted += r.count;
    if ((i / BATCH) % 10 === 0) process.stdout.write(`\r  cities inserted: ${inserted}`);
  }
  console.log(`\r  cities inserted this run: ${inserted}`);
}

/** Finds a seeded city by country ISO + name (first match, prefers the one with coordinates). */
export async function findCity(prisma: PrismaClient, iso: string, name: string) {
  const city = await prisma.city.findFirst({
    where: { name, country: { isoCode: iso } },
    orderBy: [{ lat: "desc" }],
    select: { id: true, name: true, lat: true, lng: true, countryId: true, regionId: true },
  });
  if (!city) throw new Error(`Seed city not found: ${name} (${iso}). Is SEED_COUNTRIES excluding it?`);
  return city;
}
