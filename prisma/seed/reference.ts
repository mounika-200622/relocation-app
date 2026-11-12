import type { PrismaClient } from "@prisma/client";

export const AMENITIES: { code: string; label: string }[] = [
  { code: "wifi", label: "Wi-Fi" },
  { code: "washer", label: "Washing machine" },
  { code: "dryer", label: "Dryer" },
  { code: "kitchen", label: "Kitchen" },
  { code: "dishwasher", label: "Dishwasher" },
  { code: "parking", label: "Parking" },
  { code: "bike_storage", label: "Bike storage" },
  { code: "balcony", label: "Balcony" },
  { code: "garden", label: "Garden" },
  { code: "elevator", label: "Elevator" },
  { code: "heating", label: "Heating" },
  { code: "air_conditioning", label: "Air conditioning" },
  { code: "desk", label: "Study desk" },
  { code: "tv", label: "TV" },
  { code: "gym", label: "Gym" },
  { code: "cellar", label: "Cellar storage" },
  { code: "wheelchair", label: "Step-free access" },
  { code: "cleaning", label: "Cleaning service" },
];

export const LANGUAGES: { code: string; name: string }[] = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "gsw", name: "Swiss German" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "rm", name: "Romansh" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "hi", name: "Hindi" },
  { code: "kn", name: "Kannada" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "tr", name: "Turkish" },
  { code: "ru", name: "Russian" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
];

/** Emergency numbers stored per country so the guide works beyond Switzerland. */
export const EMERGENCY: Record<string, { service: string; number: string; notes?: string }[]> = {
  CH: [
    { service: "Police", number: "117" },
    { service: "Fire brigade", number: "118" },
    { service: "Ambulance", number: "144" },
    { service: "European emergency number", number: "112", notes: "Works from any phone, connects to police." },
    { service: "Poison information (Tox Info Suisse)", number: "145" },
    { service: "Air rescue (Rega)", number: "1414" },
    { service: "Emotional support (Die Dargebotene Hand)", number: "143", notes: "Free, anonymous, 24/7." },
  ],
  DE: [
    { service: "Police", number: "110" },
    { service: "Fire / Ambulance", number: "112" },
    { service: "Out-of-hours doctor", number: "116117" },
  ],
  FR: [
    { service: "Ambulance (SAMU)", number: "15" },
    { service: "Police", number: "17" },
    { service: "Fire brigade", number: "18" },
    { service: "European emergency number", number: "112" },
  ],
  IT: [{ service: "European emergency number", number: "112" }, { service: "Ambulance", number: "118" }],
  ES: [{ service: "European emergency number", number: "112" }],
  NL: [{ service: "European emergency number", number: "112" }],
  GB: [{ service: "Emergency services", number: "999" }, { service: "European emergency number", number: "112" }, { service: "NHS non-emergency", number: "111" }],
  IN: [{ service: "National emergency number", number: "112" }, { service: "Ambulance", number: "108" }, { service: "Police", number: "100" }],
  US: [{ service: "Emergency services", number: "911" }, { service: "Suicide & crisis lifeline", number: "988" }],
  CA: [{ service: "Emergency services", number: "911" }],
  AU: [{ service: "Emergency services", number: "000" }, { service: "From mobiles (also)", number: "112" }],
  JP: [{ service: "Police", number: "110" }, { service: "Fire / Ambulance", number: "119" }],
};

export async function seedReference(prisma: PrismaClient) {
  for (const a of AMENITIES) {
    await prisma.amenity.upsert({ where: { code: a.code }, update: { label: a.label }, create: a });
  }
  for (const l of LANGUAGES) {
    await prisma.language.upsert({ where: { code: l.code }, update: { name: l.name }, create: l });
  }
  for (const [iso, rows] of Object.entries(EMERGENCY)) {
    const country = await prisma.country.findUnique({ where: { isoCode: iso }, select: { id: true } });
    if (!country) continue;
    for (const r of rows) {
      await prisma.emergencyNumber.upsert({
        where: { countryId_service: { countryId: country.id, service: r.service } },
        update: { number: r.number, notes: r.notes ?? null },
        create: { countryId: country.id, ...r },
      });
    }
  }
  console.log(`  amenities ${AMENITIES.length}, languages ${LANGUAGES.length}, emergency numbers for ${Object.keys(EMERGENCY).length} countries`);
}
