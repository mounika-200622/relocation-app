import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import type { ListingType, Preference, PrismaClient } from "@prisma/client";
import { findCity } from "./locations";
import { AMENITIES } from "./reference";
import { getDb } from "../../src/lib/mongo/client";

/** Password for every demo USER / BUSINESS account (documented in the README). */
export const DEMO_PASSWORD = "NiraDemo#2026";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const rand = rng(20261112);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
const between = (a: number, b: number) => a + rand() * (b - a);
const days = (n: number) => new Date(Date.now() + n * 86_400_000);
const dateOnly = (d: Date) => new Date(d.toISOString().slice(0, 10));
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

const BUSINESSES = [
  { email: "hello@alpinestudent.ch", name: "Alpine Student Living", desc: "Furnished student rooms and shared flats near ETH, UZH and EPFL. All-inclusive rents, flexible contracts from 3 months.", verified: true },
  { email: "rent@lakeview-residences.ch", name: "LakeView Residences", desc: "Serviced apartments and studios on Lake Geneva for young professionals and interns.", verified: true },
  { email: "team@helvetiaflats.ch", name: "Helvetia Flats", desc: "Family-run agency renting renovated flats in Basel, Bern and Lucerne since 1998.", verified: true },
  { email: "casa@ticinohomes.ch", name: "Ticino Homes", desc: "Sunny rooms and apartments in Lugano and the Ticino lakes region.", verified: false },
  { email: "info@campusnest.ch", name: "Campus Nest", desc: "Affordable dorm beds and shared rooms close to the universities of St. Gallen and Fribourg.", verified: false },
  { email: "hi@citynest-global.com", name: "CityNest Global", desc: "Co-living spaces for international students in Berlin and Bengaluru.", verified: true },
];

type SeedUser = {
  email: string; name: string; gender: "FEMALE" | "MALE" | "NON_BINARY"; occupation: "STUDENT" | "PROFESSIONAL" | "OTHER"; org?: string;
  city: [string, string]; budget: number; currency: string; moveIn: number; smoking?: "NON_SMOKER" | "OUTSIDE_ONLY" | "SMOKER";
  hasPets?: boolean; okWithPets?: boolean; social?: "QUIET" | "BALANCED" | "SOCIAL"; sleep?: "EARLY_BIRD" | "FLEXIBLE" | "NIGHT_OWL";
  roommateGender?: Preference; langs: string[]; bio: string; home: string;
};

const USERS: SeedUser[] = [
  { email: "aarav@nira.app", name: "Aarav Sharma", gender: "MALE", occupation: "STUDENT", org: "ETH Zürich", city: ["CH", "Zürich"], budget: 1000, currency: "CHF", moveIn: 30, social: "BALANCED", sleep: "NIGHT_OWL", langs: ["en", "hi"], bio: "MSc Computer Science starting this autumn. I cook a lot of dal and I'm happy to share.", home: "IN" },
  { email: "priya@nira.app", name: "Priya Nair", gender: "FEMALE", occupation: "STUDENT", org: "University of Zurich", city: ["CH", "Zürich"], budget: 950, currency: "CHF", moveIn: 35, social: "QUIET", sleep: "EARLY_BIRD", roommateGender: "FEMALE_ONLY", langs: ["en", "ta", "hi"], bio: "PhD in neuroscience. Early riser, tidy, love hiking on weekends.", home: "IN" },
  { email: "lena@nira.app", name: "Lena Müller", gender: "FEMALE", occupation: "PROFESSIONAL", org: "Google Zürich", city: ["CH", "Zürich"], budget: 1400, currency: "CHF", moveIn: 20, social: "SOCIAL", langs: ["de", "en"], bio: "Software engineer relocating from Munich. Climbing, board games, good coffee.", home: "DE" },
  { email: "mateo@nira.app", name: "Mateo García", gender: "MALE", occupation: "STUDENT", org: "ETH Zürich", city: ["CH", "Zürich"], budget: 900, currency: "CHF", moveIn: 40, smoking: "OUTSIDE_ONLY", social: "SOCIAL", sleep: "NIGHT_OWL", langs: ["es", "en"], bio: "Exchange semester in mechanical engineering. Football and paella.", home: "ES" },
  { email: "amara@nira.app", name: "Amara Okafor", gender: "FEMALE", occupation: "STUDENT", org: "ZHAW", city: ["CH", "Zürich"], budget: 1050, currency: "CHF", moveIn: 28, hasPets: true, social: "BALANCED", langs: ["en", "fr"], bio: "Design student with a very calm cat named Miso.", home: "NG" },
  { email: "rohan@nira.app", name: "Rohan Iyer", gender: "MALE", occupation: "PROFESSIONAL", org: "Roche", city: ["CH", "Zürich"], budget: 1200, currency: "CHF", moveIn: 45, social: "QUIET", sleep: "EARLY_BIRD", langs: ["en", "kn", "hi"], bio: "Data scientist moving from Bengaluru. Vegetarian, quiet, runs every morning.", home: "IN" },
  { email: "sofia@nira.app", name: "Sofia Rossi", gender: "FEMALE", occupation: "STUDENT", org: "EPFL", city: ["CH", "Lausanne"], budget: 900, currency: "CHF", moveIn: 25, langs: ["it", "en", "fr"], bio: "Architecture master's student. Plants everywhere.", home: "IT" },
  { email: "chloe@nira.app", name: "Chloé Dubois", gender: "FEMALE", occupation: "STUDENT", org: "UNIL", city: ["CH", "Lausanne"], budget: 850, currency: "CHF", moveIn: 30, social: "SOCIAL", langs: ["fr", "en"], bio: "Law student who loves the lake and late-night crêpes.", home: "FR" },
  { email: "yuki@nira.app", name: "Yuki Tanaka", gender: "FEMALE", occupation: "PROFESSIONAL", org: "WHO", city: ["CH", "Genève"], budget: 1600, currency: "CHF", moveIn: 15, social: "QUIET", langs: ["ja", "en", "fr"], bio: "Public-health consultant on a two-year contract.", home: "JP" },
  { email: "ethan@nira.app", name: "Ethan Chen", gender: "MALE", occupation: "STUDENT", org: "Graduate Institute Geneva", city: ["CH", "Genève"], budget: 1100, currency: "CHF", moveIn: 32, langs: ["zh", "en"], bio: "International relations student, amateur photographer.", home: "CN" },
  { email: "noah@nira.app", name: "Noah Weber", gender: "MALE", occupation: "OTHER", city: ["CH", "Basel"], budget: 1000, currency: "CHF", moveIn: 50, smoking: "SMOKER", social: "SOCIAL", langs: ["de", "en"], bio: "Musician and part-time barista.", home: "DE" },
  // Bengaluru demo: people moving *to* India, so the location panel shows EUR→INR, Indian SIMs and rides
  { email: "anna@nira.app", name: "Anna Becker", gender: "FEMALE", occupation: "PROFESSIONAL", org: "SAP Labs India", city: ["IN", "Bengaluru"], budget: 30000, currency: "INR", moveIn: 21, social: "BALANCED", sleep: "EARLY_BIRD", langs: ["de", "en"], bio: "Product manager on a two-year posting from Walldorf. Yoga, filter coffee, weekend trips to Coorg.", home: "DE" },
  { email: "lucas@nira.app", name: "Lucas Martin", gender: "MALE", occupation: "STUDENT", org: "IISc Bengaluru", city: ["IN", "Bengaluru"], budget: 22000, currency: "INR", moveIn: 30, social: "SOCIAL", langs: ["fr", "en"], bio: "Exchange semester in aerospace. Cricket newbie, keen to learn Kannada basics.", home: "FR" },
  { email: "mia@nira.app", name: "Mia Schmidt", gender: "NON_BINARY", occupation: "STUDENT", org: "TU Berlin", city: ["DE", "Berlin"], budget: 700, currency: "EUR", moveIn: 20, langs: ["de", "en"], bio: "Urban planning student looking for a calm WG.", home: "AT" },
];

type CitySpec = { iso: string; name: string; currency: string; base: number; streets: string[]; owner: number; count: number; center?: [number, number] };
const CITY_SPECS: CitySpec[] = [
  { iso: "CH", name: "Zürich", currency: "CHF", base: 1.0, owner: 0, count: 12, center: [47.3769, 8.5417], streets: ["Universitätstrasse", "Langstrasse", "Seefeldstrasse", "Badenerstrasse", "Hönggerstrasse", "Winterthurerstrasse", "Josefstrasse", "Bellerivestrasse"] },
  { iso: "CH", name: "Genève", currency: "CHF", base: 1.0, owner: 1, count: 6, center: [46.2044, 6.1432], streets: ["Rue de Carouge", "Boulevard Carl-Vogt", "Rue de Lausanne", "Avenue de Champel", "Rue des Pâquis"] },
  { iso: "CH", name: "Lausanne", currency: "CHF", base: 0.93, owner: 0, count: 5, center: [46.5197, 6.6323], streets: ["Avenue de Cour", "Rue du Bugnon", "Avenue de Morges", "Chemin de Bellerive"] },
  { iso: "CH", name: "Basel", currency: "CHF", base: 0.9, owner: 2, count: 4, center: [47.5596, 7.5886], streets: ["Klybeckstrasse", "Missionsstrasse", "Güterstrasse"] },
  { iso: "CH", name: "Bern", currency: "CHF", base: 0.86, owner: 2, count: 4, center: [46.948, 7.4474], streets: ["Länggassstrasse", "Breitenrainstrasse", "Effingerstrasse"] },
  { iso: "CH", name: "Luzern", currency: "CHF", base: 0.88, owner: 2, count: 2, center: [47.0502, 8.3093], streets: ["Bruchstrasse", "Tribschenstrasse"] },
  { iso: "CH", name: "Lugano", currency: "CHF", base: 0.83, owner: 3, count: 2, center: [46.0037, 8.9511], streets: ["Via Cantonale", "Via Trevano"] },
  { iso: "CH", name: "Sankt Gallen", currency: "CHF", base: 0.79, owner: 4, count: 2, center: [47.4245, 9.3767], streets: ["Rosenbergstrasse", "Dufourstrasse"] },
  { iso: "CH", name: "Fribourg", currency: "CHF", base: 0.76, owner: 4, count: 2, center: [46.8065, 7.162], streets: ["Rue de Morat", "Avenue du Midi"] },
  { iso: "CH", name: "Zug", currency: "CHF", base: 1.04, owner: 1, count: 1, center: [47.1662, 8.5155], streets: ["Baarerstrasse"] },
  { iso: "DE", name: "Berlin", currency: "EUR", base: 0.62, owner: 5, count: 3, center: [52.52, 13.405], streets: ["Kastanienallee", "Sonnenallee", "Boxhagener Straße"] },
  { iso: "IN", name: "Bengaluru", currency: "INR", base: 22, owner: 5, count: 3, center: [12.9716, 77.5946], streets: ["80 Feet Road, Koramangala", "27th Main, HSR Layout", "100 Feet Road, Indiranagar"] },
];

const TYPE_BASE: Record<ListingType, number> = { DORM: 720, SHARED_ROOM: 820, PRIVATE_ROOM: 980, STUDIO: 1550, APARTMENT: 2300 };
const TITLES: Record<ListingType, string[]> = {
  DORM: ["Bright dorm bed near campus", "Student residence room with shared kitchen", "Modern dorm with study lounge"],
  SHARED_ROOM: ["Shared twin room in friendly WG", "Spacious shared room with balcony", "Shared room in a green courtyard house"],
  PRIVATE_ROOM: ["Sunny private room in a 4-person WG", "Quiet private room with lake view", "Private room in renovated old-town flat"],
  STUDIO: ["Furnished studio with kitchenette", "Compact studio close to the tram", "Top-floor studio with skylight"],
  APARTMENT: ["2-bedroom flat for sharing", "Family-size apartment with garden", "Bright 3-room apartment near the station"],
};
const DESCRIPTIONS = [
  "Five minutes' walk to the tram and fifteen to the main station. Supermarket on the corner, laundry room in the basement with a booking plan. Rent includes heating and water.",
  "Freshly renovated with large windows and wooden floors. The flatmates are students and young professionals who share cooking on Sundays. Internet is shared and included.",
  "Calm residential street close to the university hospital. Bike storage in the courtyard, recycling station next door. Ideal for students who want quiet evenings.",
  "Fully furnished – just bring your suitcase. Bedding, kitchenware and a desk with an ergonomic chair are included. Registration with the commune is possible from day one.",
];

export async function seedDemo(prisma: PrismaClient) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---------- admins
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@nira.app").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || DEMO_PASSWORD;
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", isActive: true },
    create: { email: adminEmail, name: "Nira Admin", role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 10), onboardedAt: new Date() },
  });
  await prisma.user.upsert({
    where: { email: "moderator@nira.app" },
    update: { role: "ADMIN" },
    create: { email: "moderator@nira.app", name: "Mira Moderator", role: "ADMIN", passwordHash: hash, onboardedAt: new Date() },
  });

  // ---------- businesses
  const owners: number[] = [];
  for (const b of BUSINESSES) {
    const u = await prisma.user.upsert({
      where: { email: b.email },
      update: {},
      create: { email: b.email, name: b.name, role: "BUSINESS", passwordHash: hash, onboardedAt: new Date() },
      select: { id: true },
    });
    await prisma.businessProfile.upsert({
      where: { userId: u.id },
      update: { displayName: b.name, description: b.desc, isVerified: b.verified, verifiedAt: b.verified ? new Date() : null },
      create: { userId: u.id, displayName: b.name, description: b.desc, isVerified: b.verified, verifiedAt: b.verified ? new Date() : null },
    });
    owners.push(u.id);
  }

  // ---------- users + profiles
  const userIds = new Map<string, number>();
  for (const s of USERS) {
    const city = await findCity(prisma, s.city[0], s.city[1]);
    const homeCountry = await prisma.country.findUnique({ where: { isoCode: s.home }, select: { id: true } });
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, name: s.name, role: "USER", passwordHash: hash, onboardedAt: new Date() },
      select: { id: true },
    });
    const profile = {
      occupation: s.occupation, organization: s.org ?? null, homeCountryId: homeCountry?.id ?? null, destinationCityId: city.id, budgetMonthly: s.budget, budgetCurrency: s.currency,
      moveInDate: dateOnly(days(s.moveIn)), bio: s.bio, gender: s.gender, smoking: s.smoking ?? "NON_SMOKER", hasPets: s.hasPets ?? false,
      okWithPets: s.okWithPets ?? true, socialStyle: s.social ?? "BALANCED", sleepSchedule: s.sleep ?? "FLEXIBLE", roommateGender: s.roommateGender ?? "ANYONE",
    } as const;
    await prisma.userProfile.upsert({ where: { userId: u.id }, update: profile, create: { userId: u.id, ...profile } });
    await prisma.userLanguage.createMany({ data: s.langs.map((languageCode) => ({ userId: u.id, languageCode })), skipDuplicates: true });
    userIds.set(s.email, u.id);
  }

  // ---------- listings
  const amenityRows = await prisma.amenity.findMany({ select: { id: true, code: true } });
  const amenityId = new Map(amenityRows.map((a) => [a.code, a.id]));
  const types: ListingType[] = ["DORM", "SHARED_ROOM", "PRIVATE_ROOM", "STUDIO", "APARTMENT"];
  let photoIndex = 0;
  let created = 0;
  const listingIds: { id: number; city: string; shareable: boolean; capacityMax: number; ownerId: number; currency: string; price: number }[] = [];

  for (const spec of CITY_SPECS) {
    const city = await findCity(prisma, spec.iso, spec.name);
    const [clat, clng] = spec.center ?? [city.lat ?? 0, city.lng ?? 0];
    for (let i = 0; i < spec.count; i++) {
      const type = types[(i + spec.name.length) % types.length]!;
      const title = `${TITLES[type][Math.floor(i / types.length) % 3]} · ${spec.name === "Genève" ? "Geneva" : spec.name === "Luzern" ? "Lucerne" : spec.name === "Sankt Gallen" ? "St. Gallen" : spec.name}`;
      const ownerId = owners[spec.owner]!;
      const existing = await prisma.listing.findFirst({ where: { ownerId, title }, select: { id: true, isShareable: true, capacityMax: true, price: true } });
      const shareable = type !== "STUDIO" && (type === "DORM" || type === "SHARED_ROOM" || type === "APARTMENT" || rand() > 0.5);
      const capacityMax = type === "DORM" ? 4 : type === "SHARED_ROOM" ? 2 : type === "APARTMENT" ? 3 : 1;
      const price = Math.round((TYPE_BASE[type] * spec.base * between(0.85, 1.2)) / 10) * 10;
      if (existing) {
        listingIds.push({ id: existing.id, city: spec.name, shareable: existing.isShareable, capacityMax: existing.capacityMax, ownerId, currency: spec.currency, price: Number(existing.price) });
        continue;
      }
      const occupants = shareable ? Math.min(capacityMax - 1, Math.floor(rand() * capacityMax)) : 0;
      const listing = await prisma.listing.create({
        data: {
          ownerId, cityId: city.id, type, title,
          description: `${pick(DESCRIPTIONS)}\n\n${pick(DESCRIPTIONS)}`,
          address: `${spec.streets[i % spec.streets.length]} ${Math.floor(between(2, 140))}`,
          lat: clat + between(-0.018, 0.018), lng: clng + between(-0.025, 0.025),
          price, deposit: Math.round(price * (type === "DORM" ? 1 : 2)), currency: spec.currency,
          bedrooms: type === "APARTMENT" ? 2 + (i % 2) : 1, bathrooms: type === "APARTMENT" ? 2 : 1,
          sizeSqm: type === "DORM" ? 16 : type === "STUDIO" ? 28 : type === "APARTMENT" ? 70 + i * 4 : 18,
          furnished: type !== "APARTMENT" || rand() > 0.5, availableFrom: dateOnly(days(Math.floor(between(-5, 60)))),
          minStayMonths: type === "DORM" ? 3 : type === "STUDIO" && i % 3 === 0 ? 1 : 6,
          utilitiesIncluded: rand() > 0.4, billsEstimate: Math.round(price * 0.08),
          petsAllowed: rand() > 0.7, smokingAllowed: rand() > 0.85, guestsAllowed: rand() > 0.2,
          isShareable: shareable, capacityMin: 1, capacityMax, currentOccupants: occupants,
          genderPreference: i % 7 === 3 ? "FEMALE_ONLY" : i % 11 === 5 ? "MALE_ONLY" : "ANYONE",
          createdAt: days(-Math.floor(between(1, 40))),
        },
        select: { id: true },
      });
      const nPhotos = 3 + (i % 3);
      await prisma.listingPhoto.createMany({
        data: Array.from({ length: nPhotos }, (_, k) => {
          const file = `/samples/home-${String(((photoIndex + k) % 16) + 1).padStart(2, "0")}.svg`;
          return { listingId: listing.id, url: file, storageKey: `sample:${file}`, position: k, caption: k === 0 ? "Main room" : null };
        }),
      });
      photoIndex += 3;
      const codes = AMENITIES.map((a) => a.code).filter(() => rand() > 0.55);
      for (const must of ["heating", "wifi"]) if (!codes.includes(must)) codes.push(must);
      await prisma.listingAmenity.createMany({ data: codes.map((c) => ({ listingId: listing.id, amenityId: amenityId.get(c)! })), skipDuplicates: true });
      listingIds.push({ id: listing.id, city: spec.name, shareable, capacityMax, ownerId, currency: spec.currency, price });
      created++;
    }
  }
  console.log(`  listings: ${listingIds.length} (${created} new)`);

  // ---------- roommate requests (Zurich seekers on shareable Zurich places)
  const zurichShared = listingIds.filter((l) => l.city === "Zürich" && l.shareable);
  const seekers = ["aarav@nira.app", "priya@nira.app", "mateo@nira.app", "amara@nira.app", "rohan@nira.app", "lena@nira.app"];
  const notes = [
    "Hi! I start my master's in September and would love to share this place. Tidy, friendly, and I cook.",
    "Looking for calm flatmates – I work regular hours and enjoy weekend hikes.",
    "Exchange student for two semesters, easy-going and happy to split groceries.",
    "Would love to share with other students; I have a quiet cat, very low maintenance.",
  ];
  let reqCount = 0;
  for (const [li, l] of zurichShared.slice(0, 4).entries()) {
    for (const [si, email] of seekers.entries()) {
      if ((li + si) % 2 === 1) continue;
      const requesterId = userIds.get(email)!;
      const exists = await prisma.roommateRequest.findFirst({ where: { listingId: l.id, requesterId }, select: { id: true } });
      if (exists) continue;
      await prisma.roommateRequest.create({
        data: { listingId: l.id, requesterId, message: notes[(li + si) % notes.length]!, moveInDate: dateOnly(days(25 + si * 4)), budgetShare: Math.round(l.price / Math.max(2, l.capacityMax)) },
      });
      reqCount++;
    }
  }
  // Bengaluru demo: Lucas and Anna both want to share the same place, so each shows up as a match for the other
  const blrShared = listingIds.filter((l) => l.city === "Bengaluru" && l.shareable);
  const blrSeekers: [string, string][] = [
    ["lucas@nira.app", "Exchange student at IISc for a semester – easy-going, early to bed during exams, happy to split groceries."],
    ["anna@nira.app", "Two-year posting at SAP Labs. Tidy, quiet on weeknights, love cooking South Indian food on weekends."],
  ];
  if (blrShared[0]) {
    const l = blrShared[0];
    for (const [si, [email, message]] of blrSeekers.entries()) {
      const requesterId = userIds.get(email)!;
      const exists = await prisma.roommateRequest.findFirst({ where: { listingId: l.id, requesterId }, select: { id: true } });
      if (exists) continue;
      await prisma.roommateRequest.create({
        data: { listingId: l.id, requesterId, message, moveInDate: dateOnly(days(21 + si * 7)), budgetShare: Math.round(l.price / Math.max(2, l.capacityMax)) },
      });
      reqCount++;
    }
    const anna = userIds.get("anna@nira.app")!;
    for (const s of listingIds.filter((x) => x.city === "Bengaluru").slice(0, 2)) {
      await prisma.savedListing.upsert({ where: { userId_listingId: { userId: anna, listingId: s.id } }, update: {}, create: { userId: anna, listingId: s.id } });
    }
  }
  console.log(`  roommate requests: +${reqCount}`);

  // ---------- saved listings, views, checklist progress
  const aarav = userIds.get("aarav@nira.app")!;
  const priya = userIds.get("priya@nira.app")!;
  for (const l of zurichShared.slice(0, 3)) await prisma.savedListing.upsert({ where: { userId_listingId: { userId: aarav, listingId: l.id } }, update: {}, create: { userId: aarav, listingId: l.id } });
  for (const l of zurichShared.slice(1, 4)) await prisma.savedListing.upsert({ where: { userId_listingId: { userId: priya, listingId: l.id } }, update: {}, create: { userId: priya, listingId: l.id } });

  const viewRows: { listingId: number; viewerId: number | null; viewerKey: string; viewedOn: Date }[] = [];
  const allUsers = [...userIds.values()];
  for (const l of listingIds) {
    const n = 3 + Math.floor(rand() * 18);
    for (let k = 0; k < n; k++) {
      const viewer = rand() > 0.4 ? pick(allUsers) : null;
      const day = dateOnly(days(-Math.floor(rand() * 14)));
      viewRows.push({ listingId: l.id, viewerId: viewer, viewerKey: sha(`seed:${viewer ?? `anon${k}`}:${l.id}`), viewedOn: day });
    }
  }
  await prisma.listingView.createMany({ data: viewRows, skipDuplicates: true });

  const items = await prisma.checklistTemplate.findMany({ where: { country: { isoCode: "CH" } }, orderBy: { position: "asc" }, take: 4, select: { id: true } });
  await prisma.userChecklistProgress.createMany({ data: items.slice(0, 3).map((it) => ({ userId: aarav, itemId: it.id })), skipDuplicates: true });

  // ---------- conversations (header in MySQL, messages in MongoDB)
  const convos: { a: number; b: number; listingId: number | null; lines: [number, string][] }[] = [];
  const firstZurich = zurichShared[0]!;
  convos.push({
    a: aarav, b: firstZurich.ownerId, listingId: firstZurich.id,
    lines: [
      [aarav, "Hi! Is the room still available from September 1st?"],
      [firstZurich.ownerId, "Hello Aarav, yes it is. Would you like to do a video viewing this week?"],
      [aarav, "That would be great – Thursday evening works for me."],
      [firstZurich.ownerId, "Perfect, Thursday 18:30. I'll send you the link here."],
    ],
  });
  convos.push({
    a: aarav, b: priya, listingId: zurichShared[1]?.id ?? null,
    lines: [
      [priya, "Hey! I saw we both requested the shared flat on Seefeldstrasse."],
      [aarav, "Yes! Would you want to apply together? It's a 2-person room split."],
      [priya, "Sounds good. I'm an early riser and pretty quiet – hope that's fine 🙂"],
    ],
  });
  const lena = userIds.get("lena@nira.app")!;
  convos.push({ a: lena, b: owners[0]!, listingId: zurichShared[2]?.id ?? null, lines: [[lena, "Hello, are utilities included in the rent?"], [owners[0]!, "Heating, water and internet are included; electricity is about CHF 40 per month."]] });

  let mongoOk = true;
  for (const c of convos) {
    const [userAId, userBId] = c.a < c.b ? [c.a, c.b] : [c.b, c.a];
    const contextKey = c.listingId ?? 0;
    const last = c.lines[c.lines.length - 1]!;
    const convo = await prisma.conversation.upsert({
      where: { userAId_userBId_contextKey: { userAId, userBId, contextKey } },
      update: {},
      create: { userAId, userBId, contextKey, listingId: c.listingId, lastMessageAt: new Date(), lastMessagePreview: last[1].slice(0, 160), lastSenderId: last[0] },
      select: { id: true },
    });
    try {
      const db = await getDb();
      const messages = db.collection("messages");
      if ((await messages.countDocuments({ conversationId: convo.id })) === 0) {
        const start = Date.now() - c.lines.length * 3_600_000;
        await messages.insertMany(
          c.lines.map(([senderId, text], i) => ({ conversationId: convo.id, senderId, text, sentAt: new Date(start + i * 3_600_000), readAt: i < c.lines.length - 1 ? new Date(start + i * 3_600_000 + 60_000) : null })),
        );
      }
    } catch (err) {
      mongoOk = false;
      console.warn(`  (MongoDB unavailable, skipped chat messages: ${(err as Error).message})`);
      break;
    }
  }
  if (mongoOk) {
    const db = await getDb();
    const n = db.collection("notifications");
    if ((await n.countDocuments({ userId: firstZurich.ownerId })) === 0) {
      await n.insertMany([
        { userId: firstZurich.ownerId, type: "ROOMMATE_REQUEST", title: "New roommate request", body: "Aarav Sharma wants to share one of your places.", link: `/listings/${firstZurich.id}#roommates`, createdAt: new Date(), readAt: null },
        { userId: aarav, type: "NEW_MESSAGE", title: "New message", body: "Alpine Student Living replied to you.", link: "/chat", createdAt: new Date(), readAt: null },
      ]);
    }
  }
  console.log(`  conversations: ${convos.length}${mongoOk ? " (+ messages in MongoDB)" : ""}`);
}
