import type { PrismaClient, RideKind } from "@prisma/client";

/**
 * Taxis, ride-hailing and bike/scooter share per country. Booking happens in the provider's
 * own app: Nira only opens it (deep link with the destination where the provider documents one).
 */
const UBER = "https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]={lat}&dropoff[longitude]={lng}&dropoff[nickname]={name}";
const LYFT = "lyft://ridetype?id=lyft&destination[latitude]={lat}&destination[longitude]={lng}";

type Ride = { name: string; kind: RideKind; website?: string; deepLink?: string; phone?: string; notes?: string };

const RIDES: Record<string, Ride[]> = {
  CH: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/ch/en/", deepLink: UBER, notes: "Available in Zürich, Geneva, Basel, Lausanne and Bern areas." },
    { name: "Metered taxi", kind: "TAXI", notes: "Taxi ranks at main stations. Metered and expensive – check the rate card in the window; tipping is optional." },
    { name: "PubliBike", kind: "BIKE_SHARE", website: "https://www.publibike.ch/en", notes: "Bike and e-bike sharing in many Swiss cities; unlock in the app." },
  ],
  DE: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/de/en/", deepLink: UBER, notes: "Mostly licensed private-hire and taxi partners in larger cities." },
    { name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/", notes: "App for booking licensed taxis." },
    { name: "Bolt", kind: "RIDE_HAILING", website: "https://bolt.eu/" },
    { name: "nextbike", kind: "BIKE_SHARE", website: "https://www.nextbike.de/en/" },
    { name: "Lime", kind: "SCOOTER", website: "https://www.li.me/" },
  ],
  FR: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/fr/en/", deepLink: UBER },
    { name: "Bolt", kind: "RIDE_HAILING", website: "https://bolt.eu/" },
    { name: "G7 Taxi", kind: "TAXI", website: "https://www.g7.fr/en", notes: "Large taxi company in Paris." },
    { name: "Vélib' Métropole", kind: "BIKE_SHARE", website: "https://www.velib-metropole.fr/en", notes: "Paris region bike sharing." },
    { name: "Lime", kind: "SCOOTER", website: "https://www.li.me/" },
  ],
  GB: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/gb/en/", deepLink: UBER },
    { name: "Bolt", kind: "RIDE_HAILING", website: "https://bolt.eu/" },
    { name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/uk/", notes: "Book black cabs and private hire." },
    { name: "Santander Cycles", kind: "BIKE_SHARE", website: "https://tfl.gov.uk/modes/cycling/santander-cycles", notes: "London bike hire." },
  ],
  NL: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/nl/en/", deepLink: UBER },
    { name: "Bolt", kind: "RIDE_HAILING", website: "https://bolt.eu/" },
    { name: "OV-fiets", kind: "BIKE_SHARE", website: "https://www.ns.nl/en/door-to-door/ov-fiets", notes: "Rental bikes at train stations, needs a personal OV-chipkaart." },
  ],
  IT: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/it/en/", deepLink: UBER, notes: "Mainly Uber Black and taxis in Rome and Milan." },
    { name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/it-en/" },
  ],
  ES: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/es/en/", deepLink: UBER },
    { name: "Cabify", kind: "RIDE_HAILING", website: "https://cabify.com/" },
    { name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/es-en/" },
  ],
  US: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/us/en/", deepLink: UBER },
    { name: "Lyft", kind: "RIDE_HAILING", website: "https://www.lyft.com/", deepLink: LYFT },
    { name: "Citi Bike", kind: "BIKE_SHARE", website: "https://citibikenyc.com/", notes: "New York City bike share." },
    { name: "Lime", kind: "SCOOTER", website: "https://www.li.me/" },
  ],
  CA: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/ca/en/", deepLink: UBER },
    { name: "Lyft", kind: "RIDE_HAILING", website: "https://www.lyft.com/", deepLink: LYFT },
  ],
  AU: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/au/en/", deepLink: UBER },
    { name: "DiDi", kind: "RIDE_HAILING", website: "https://australia.didiglobal.com/" },
    { name: "13cabs", kind: "TAXI", website: "https://www.13cabs.com.au/", phone: "13 22 27" },
  ],
  IN: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/in/en/", deepLink: UBER, notes: "Cars, autos and moto in most big cities." },
    { name: "Ola", kind: "RIDE_HAILING", website: "https://www.olacabs.com/", notes: "Cars and auto-rickshaws." },
    { name: "Rapido", kind: "RIDE_HAILING", website: "https://www.rapido.bike/", notes: "Bike taxis and autos – often the cheapest option." },
    { name: "Namma Yatri", kind: "TAXI", website: "https://nammayatri.in/", notes: "Driver-owned auto-rickshaw app from Bengaluru – fair metered fares." },
    { name: "Yulu", kind: "BIKE_SHARE", website: "https://www.yulu.bike/", notes: "E-bikes in Bengaluru and a few other cities." },
  ],
  JP: [
    { name: "Uber", kind: "RIDE_HAILING", website: "https://www.uber.com/jp/en/", deepLink: UBER, notes: "Books licensed taxis in Tokyo and other big cities." },
    { name: "Metered taxi", kind: "TAXI", notes: "Doors open automatically; tipping is not expected." },
  ],
};

export async function seedRides(prisma: PrismaClient) {
  let n = 0;
  for (const [iso, rides] of Object.entries(RIDES)) {
    const country = await prisma.country.findUnique({ where: { isoCode: iso }, select: { id: true } });
    if (!country) continue;
    for (const [position, r] of rides.entries()) {
      const data = { kind: r.kind, website: r.website ?? null, deepLink: r.deepLink ?? null, phone: r.phone ?? null, notes: r.notes ?? null, position };
      await prisma.rideService.upsert({ where: { countryId_name: { countryId: country.id, name: r.name } }, update: data, create: { ...data, countryId: country.id, name: r.name } });
      n++;
    }
  }
  console.log(`  ride services: ${n} in ${Object.keys(RIDES).length} countries`);
}
