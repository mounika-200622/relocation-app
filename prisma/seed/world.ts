import type { PrismaClient, RideKind, TransportModeKind } from "@prisma/client";

/**
 * Practical basics for popular destinations: mobile operators, how public transport works
 * and which ride apps people use. No prices here (they change too often) – just who to use
 * and how. Switzerland and India have full guides in guide-ch.ts / guide-in.ts.
 */
type Country = {
  sims: string[];
  mvno?: string[];
  simDocs: string;
  simWhere: string;
  transit: { mode: TransportModeKind; title: string; description: string; howToBuy?: string; apps?: string }[];
  rides: { name: string; kind: RideKind; website: string; deepLink?: string; notes?: string }[];
};

const UBER = "https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]={lat}&dropoff[longitude]={lng}&dropoff[nickname]={name}";
const uber = (cc: string, notes?: string) => ({ name: "Uber", kind: "RIDE_HAILING" as const, website: `https://www.uber.com/${cc}/en/`, deepLink: UBER, notes });
const grab = (notes?: string) => ({ name: "Grab", kind: "RIDE_HAILING" as const, website: "https://www.grab.com/", notes: notes ?? "The main ride and food app in South-East Asia; cars, bikes and taxis." });
const bolt = { name: "Bolt", kind: "RIDE_HAILING" as const, website: "https://bolt.eu/" };
const PASSPORT = "Passport (and visa/residence permit for monthly contracts)";

export const WORLD: Record<string, Country> = {
  US: { sims: ["AT&T", "Verizon", "T-Mobile"], mvno: ["Mint Mobile"], simDocs: "Passport for prepaid; postpaid may need an SSN or deposit", simWhere: "Carrier stores, Best Buy, Target, online eSIM",
    transit: [{ mode: "METRO", title: "Subway / metro", description: "Big cities have rail systems – New York subway, Washington Metro, Chicago 'L', BART in San Francisco.", howToBuy: "Tap a contactless card or phone (e.g. OMNY in New York).", apps: "Transit, Google Maps" }, { mode: "BUS", title: "City buses", description: "Available everywhere but less frequent outside big cities; exact change or tap-to-pay.", howToBuy: "Contactless or the city's transit card." }],
    rides: [uber("us"), { name: "Lyft", kind: "RIDE_HAILING", website: "https://www.lyft.com/", deepLink: "lyft://ridetype?id=lyft&destination[latitude]={lat}&destination[longitude]={lng}" }] },
  GB: { sims: ["EE", "Vodafone", "O2", "Three"], mvno: ["giffgaff"], simDocs: "No ID needed for prepaid", simWhere: "Phone shops, supermarkets, online eSIM",
    transit: [{ mode: "METRO", title: "London Underground and Overground", description: "Tube, Elizabeth line and Overground cover London; daily and weekly fare caps apply automatically.", howToBuy: "Tap a contactless card or phone (same as Oyster).", apps: "TfL Go, Citymapper" }, { mode: "BUS", title: "Buses", description: "London buses are cashless – tap on with contactless. Outside London, pay the driver or tap.", howToBuy: "Contactless card or phone." }, { mode: "TRAIN", title: "National Rail", description: "Book advance tickets and get a Railcard (16-25, 26-30) for a third off.", apps: "Trainline, National Rail" }],
    rides: [uber("gb"), bolt, { name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/uk/", notes: "Black cabs and private hire." }] },
  CA: { sims: ["Rogers", "Bell", "Telus"], mvno: ["Public Mobile"], simDocs: "Passport; postpaid may need a credit check", simWhere: "Carrier stores, malls, online",
    transit: [{ mode: "METRO", title: "Subway / SkyTrain / Métro", description: "Toronto TTC subway, Vancouver SkyTrain and Montréal Métro.", howToBuy: "PRESTO (Toronto), Compass (Vancouver), OPUS (Montréal) or tap-to-pay." }, { mode: "BUS", title: "City buses", description: "Same fare system as the local subway; transfers are usually free within a time window." }],
    rides: [uber("ca"), { name: "Lyft", kind: "RIDE_HAILING", website: "https://www.lyft.com/", deepLink: "lyft://ridetype?id=lyft&destination[latitude]={lat}&destination[longitude]={lng}" }] },
  AU: { sims: ["Telstra", "Optus", "Vodafone"], simDocs: "Passport (ID check required by law)", simWhere: "Airport kiosks, carrier stores, supermarkets",
    transit: [{ mode: "TRAIN", title: "Suburban trains", description: "Sydney Trains, Melbourne Metro and others connect the suburbs.", howToBuy: "Opal (Sydney), myki (Melbourne) or tap a contactless card." }, { mode: "TRAM", title: "Trams and buses", description: "Melbourne has a free tram zone in the CBD; buses everywhere." }],
    rides: [uber("au"), { name: "DiDi", kind: "RIDE_HAILING", website: "https://australia.didiglobal.com/" }, { name: "13cabs", kind: "TAXI", website: "https://www.13cabs.com.au/" }] },
  DE: { sims: ["Telekom", "Vodafone", "O2"], mvno: ["Aldi Talk"], simDocs: "Passport + video ID or in-store ID check (legally required)", simWhere: "Carrier shops, supermarkets, petrol stations",
    transit: [{ mode: "METRO", title: "U-Bahn and S-Bahn", description: "Underground and suburban trains in big cities, integrated with trams and buses.", howToBuy: "City app, machines, or the nationwide Deutschlandticket subscription for local transport.", apps: "DB Navigator, local transit apps" }, { mode: "BUS", title: "Buses and trams", description: "Same tickets as the U/S-Bahn. Validate paper tickets before you ride." }],
    rides: [uber("de"), { name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/" }, bolt] },
  FR: { sims: ["Orange", "SFR", "Bouygues Telecom", "Free Mobile"], simDocs: "Passport", simWhere: "Carrier shops, tabacs, airports, online",
    transit: [{ mode: "METRO", title: "Métro and RER", description: "Paris Métro and RER, plus metros in Lyon, Marseille, Lille and Toulouse.", howToBuy: "Navigo card, Navigo Easy or the Bonjour RATP app.", apps: "Bonjour RATP, Citymapper" }, { mode: "BUS", title: "Buses and trams", description: "Same tickets as the metro in each city." }],
    rides: [uber("fr"), bolt, { name: "G7 Taxi", kind: "TAXI", website: "https://www.g7.fr/en" }] },
  NL: { sims: ["KPN", "Vodafone", "Odido"], simDocs: "Passport for subscriptions; prepaid without ID", simWhere: "Carrier shops, supermarkets",
    transit: [{ mode: "TRAIN", title: "NS trains", description: "Frequent trains between all cities.", howToBuy: "Tap in and out with a contactless card (OVpay) or an OV-chipkaart.", apps: "NS, 9292" }, { mode: "TRAM", title: "Trams, metro and buses", description: "Same tap-in/tap-out system in every city." }, { mode: "BIKE", title: "Cycling", description: "The main way to get around; use bike lanes and lights at night." }],
    rides: [uber("nl"), bolt] },
  IT: { sims: ["TIM", "Vodafone", "WindTre", "Iliad"], simDocs: "Passport and Italian tax code (codice fiscale) – shops can request it for you", simWhere: "Carrier shops, airports",
    transit: [{ mode: "METRO", title: "Metro", description: "Milan, Rome, Naples, Turin and others.", howToBuy: "Tap a contactless card or buy tickets at machines/tabacchi." }, { mode: "BUS", title: "Buses and trams", description: "Validate paper tickets on board." }, { mode: "TRAIN", title: "Trains", description: "Trenitalia and Italo between cities.", apps: "Trenitalia, Italo" }],
    rides: [uber("it", "Mainly Uber Black/taxis in Rome and Milan."), { name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/it-en/" }] },
  ES: { sims: ["Movistar", "Vodafone", "Orange"], mvno: ["Digi"], simDocs: "Passport", simWhere: "Carrier shops, airports",
    transit: [{ mode: "METRO", title: "Metro", description: "Madrid, Barcelona, Valencia, Bilbao and others.", howToBuy: "Rechargeable transport cards or contactless." }, { mode: "BUS", title: "Buses", description: "Same card as the metro in each city." }],
    rides: [uber("es"), { name: "Cabify", kind: "RIDE_HAILING", website: "https://cabify.com/" }, { name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/es-en/" }] },
  PT: { sims: ["MEO", "NOS", "Vodafone"], simDocs: "Passport", simWhere: "Carrier shops, airports",
    transit: [{ mode: "METRO", title: "Metro", description: "Lisbon and Porto metros.", howToBuy: "Navegante (Lisbon) or Andante (Porto) cards." }, { mode: "TRAM", title: "Trams and buses", description: "Same cards; Lisbon's historic trams are part of the network." }],
    rides: [uber("pt"), bolt] },
  IE: { sims: ["Vodafone", "Three", "Eir"], simDocs: "No ID for prepaid", simWhere: "Carrier shops, supermarkets",
    transit: [{ mode: "BUS", title: "Dublin Bus and TFI buses", description: "Main way around Dublin; Leap card gives cheaper fares.", howToBuy: "Leap card or the TFI Go app." }, { mode: "TRAM", title: "Luas tram and DART", description: "Trams and coastal trains in Dublin." }],
    rides: [{ name: "FREENOW", kind: "TAXI", website: "https://www.free-now.com/ie/", notes: "Most popular taxi app in Ireland." }, uber("ie", "Books licensed taxis.")] },
  AT: { sims: ["A1", "Magenta", "Drei"], simDocs: "Passport (registration required)", simWhere: "Carrier shops, supermarkets",
    transit: [{ mode: "METRO", title: "Vienna U-Bahn", description: "Plus trams and buses in all cities.", howToBuy: "WienMobil app or machines; the annual pass is great value.", apps: "WienMobil, ÖBB" }, { mode: "TRAIN", title: "ÖBB trains", description: "Between cities; KlimaTicket covers almost all public transport." }],
    rides: [uber("at"), bolt] },
  SE: { sims: ["Telia", "Tele2", "Telenor", "Tre"], simDocs: "Passport", simWhere: "Pressbyrån, carrier shops",
    transit: [{ mode: "METRO", title: "Tunnelbana", description: "Stockholm metro plus commuter trains.", howToBuy: "SL app or tap a contactless card.", apps: "SL" }, { mode: "BUS", title: "Buses", description: "Cashless; buy before boarding." }],
    rides: [uber("se"), bolt] },
  PL: { sims: ["Orange", "Play", "Plus", "T-Mobile"], simDocs: "Passport (prepaid registration required)", simWhere: "Kiosks, carrier shops",
    transit: [{ mode: "TRAM", title: "Trams and buses", description: "Dense networks in every city; Warsaw also has a metro.", howToBuy: "Machines, apps (jakdojade) or contactless." }],
    rides: [uber("pl"), bolt] },
  JP: { sims: ["NTT Docomo", "au (KDDI)", "SoftBank", "Rakuten Mobile"], simDocs: "Residence card for contracts; visitors use data-only eSIMs", simWhere: "Airport counters, Bic Camera/Yodobashi, online eSIM",
    transit: [{ mode: "TRAIN", title: "Trains and subways", description: "JR, private lines and subways run to the minute.", howToBuy: "Suica or PASMO IC card (also in Apple/Google Wallet).", apps: "Japan Transit Planner, Google Maps" }, { mode: "BUS", title: "Buses", description: "Pay with the same IC card; board at the back in many cities." }],
    rides: [uber("jp", "Books licensed taxis in big cities."), { name: "GO", kind: "TAXI", website: "https://go.goinc.jp/", notes: "Popular Japanese taxi app." }] },
  KR: { sims: ["SK Telecom", "KT", "LG U+"], simDocs: "Passport (alien registration card for contracts)", simWhere: "Airport counters, carrier shops",
    transit: [{ mode: "METRO", title: "Subway", description: "Seoul, Busan and other cities; clean, frequent and cheap.", howToBuy: "T-money card from convenience stores.", apps: "Naver Map, KakaoMap" }, { mode: "BUS", title: "Buses", description: "Tap the T-money card on and off for free transfers." }],
    rides: [{ name: "Kakao T", kind: "TAXI", website: "https://www.kakaomobility.com/", notes: "Most used taxi app in Korea." }, uber("kr", "Books taxis (UT).")] },
  SG: { sims: ["Singtel", "StarHub", "M1"], simDocs: "Passport (registration at purchase)", simWhere: "Airport, 7-Eleven, Cheers, carrier shops",
    transit: [{ mode: "METRO", title: "MRT", description: "Fast, air-conditioned trains across the island.", howToBuy: "Tap a contactless card/phone (SimplyGo) or an EZ-Link card.", apps: "SG BusLeh, Google Maps" }, { mode: "BUS", title: "Buses", description: "Same tap-to-pay as the MRT; transfers count as one journey." }],
    rides: [grab(), { name: "Gojek", kind: "RIDE_HAILING", website: "https://www.gojek.com/sg/" }, { name: "TADA", kind: "RIDE_HAILING", website: "https://tada.global/" }] },
  AE: { sims: ["e& (Etisalat)", "du"], simDocs: "Passport with entry stamp or Emirates ID", simWhere: "Airport counters, malls",
    transit: [{ mode: "METRO", title: "Dubai Metro", description: "Red and Green lines plus the tram; Abu Dhabi has buses.", howToBuy: "Nol card (Dubai), Hafilat (Abu Dhabi).", apps: "RTA Dubai, S'hail" }, { mode: "BUS", title: "Buses", description: "Air-conditioned buses with the same cards." }],
    rides: [{ name: "Careem", kind: "RIDE_HAILING", website: "https://www.careem.com/", notes: "Middle East super-app for rides and delivery." }, uber("ae")] },
  VN: { sims: ["Viettel", "Vinaphone", "Mobifone"], simDocs: "Passport (SIM registration required)", simWhere: "Airport counters, official carrier stores",
    transit: [{ mode: "BUS", title: "City buses", description: "Cheap buses in Hanoi and Ho Chi Minh City; pay the conductor or with a card.", howToBuy: "Cash or the city bus card.", apps: "BusMap" }, { mode: "METRO", title: "Metro lines", description: "Hanoi's Cat Linh line and Ho Chi Minh City's Metro Line 1 (Ben Thanh – Suoi Tien).", howToBuy: "Tickets at stations or contactless." }],
    rides: [grab("Most used app in Vietnam for motorbike and car rides."), { name: "Be", kind: "RIDE_HAILING", website: "https://be.com.vn/", notes: "Vietnamese ride app." }, { name: "Xanh SM", kind: "TAXI", website: "https://www.xanhsm.com/", notes: "Electric taxis and bikes." }] },
  TH: { sims: ["AIS", "True"], simDocs: "Passport (registration required)", simWhere: "Airport counters, 7-Eleven, carrier shops",
    transit: [{ mode: "METRO", title: "BTS Skytrain and MRT", description: "Bangkok's elevated and underground lines.", howToBuy: "Rabbit card (BTS) or contactless on MRT.", apps: "ViaBus, Google Maps" }, { mode: "BOAT", title: "River boats", description: "Chao Phraya Express boats along the river." }],
    rides: [grab(), bolt, { name: "LINE MAN", kind: "RIDE_HAILING", website: "https://lineman.line.me/" }] },
  ID: { sims: ["Telkomsel", "Indosat Ooredoo", "XL Axiata"], simDocs: "Passport; phones bought abroad must be IMEI-registered for long stays", simWhere: "Airport counters, official stores",
    transit: [{ mode: "METRO", title: "Jakarta MRT, LRT and KRL", description: "Rail lines in Greater Jakarta.", howToBuy: "Bank e-money cards or the app." }, { mode: "BUS", title: "TransJakarta", description: "Bus rapid transit with dedicated lanes." }],
    rides: [{ name: "Gojek", kind: "RIDE_HAILING", website: "https://www.gojek.com/", notes: "Indonesian super-app: bikes, cars, food." }, grab()] },
  MY: { sims: ["Maxis", "CelcomDigi", "U Mobile"], simDocs: "Passport", simWhere: "Airport counters, convenience stores",
    transit: [{ mode: "METRO", title: "Rapid KL (LRT, MRT, Monorail)", description: "Rail network in Kuala Lumpur.", howToBuy: "Touch 'n Go card or contactless." }],
    rides: [grab(), { name: "AirAsia Ride", kind: "RIDE_HAILING", website: "https://www.airasia.com/ride/" }] },
  PH: { sims: ["Globe", "Smart", "DITO"], simDocs: "Passport (SIM registration law)", simWhere: "Airport counters, malls",
    transit: [{ mode: "METRO", title: "MRT and LRT", description: "Metro Manila rail lines.", howToBuy: "Beep card." }, { mode: "BUS", title: "Jeepneys and buses", description: "Cheap shared jeepneys follow fixed routes; pay in cash." }],
    rides: [grab(), { name: "JoyRide", kind: "RIDE_HAILING", website: "https://joyride.com.ph/" }] },
  CN: { sims: ["China Mobile", "China Unicom", "China Telecom"], simDocs: "Passport (real-name registration)", simWhere: "Official carrier stores, airports",
    transit: [{ mode: "METRO", title: "Metro", description: "Extensive subways in all big cities.", howToBuy: "QR code in Alipay/WeChat or a transport card." }, { mode: "TRAIN", title: "High-speed rail", description: "Book on 12306 with your passport." }],
    rides: [{ name: "DiDi", kind: "RIDE_HAILING", website: "https://www.didiglobal.com/", notes: "Available in English inside Alipay and WeChat." }] },
  BR: { sims: ["Vivo", "Claro", "TIM"], simDocs: "Passport (CPF needed for some plans)", simWhere: "Carrier shops, airports",
    transit: [{ mode: "METRO", title: "Metrô", description: "São Paulo, Rio and others.", howToBuy: "Bilhete Único (São Paulo) or contactless." }, { mode: "BUS", title: "Buses", description: "Extensive city bus networks." }],
    rides: [{ name: "99", kind: "RIDE_HAILING", website: "https://99app.com/" }, uber("br")] },
  MX: { sims: ["Telcel", "AT&T México", "Movistar"], simDocs: "Passport", simWhere: "OXXO stores, carrier shops",
    transit: [{ mode: "METRO", title: "Metro", description: "Mexico City Metro and Metrobús are cheap and frequent.", howToBuy: "Integrated mobility card (Tarjeta de Movilidad Integrada)." }],
    rides: [uber("mx"), { name: "DiDi", kind: "RIDE_HAILING", website: "https://web.didiglobal.com/mx/" }] },
  TR: { sims: ["Turkcell", "Vodafone", "Türk Telekom"], simDocs: "Passport; foreign phones need IMEI registration after 120 days", simWhere: "Airport counters, official stores",
    transit: [{ mode: "METRO", title: "Metro, tram and ferries", description: "Istanbul's metro, trams, Marmaray and ferries.", howToBuy: "İstanbulkart." }],
    rides: [{ name: "BiTaksi", kind: "TAXI", website: "https://www.bitaksi.com/", notes: "Book yellow taxis." }, uber("tr", "Books taxis.")] },
  NZ: { sims: ["One NZ", "Spark", "2degrees"], simDocs: "No ID for prepaid", simWhere: "Airport, supermarkets",
    transit: [{ mode: "BUS", title: "Buses", description: "Main public transport in most cities; Auckland also has trains and ferries.", howToBuy: "AT HOP (Auckland), Snapper (Wellington)." }],
    rides: [uber("nz")] },
  ZA: { sims: ["Vodacom", "MTN", "Cell C", "Telkom"], simDocs: "Passport and proof of address (RICA registration)", simWhere: "Airport, carrier shops",
    transit: [{ mode: "TRAIN", title: "Gautrain", description: "Fast train between Johannesburg, Pretoria and the airport." }, { mode: "BUS", title: "MyCiTi and Rea Vaya buses", description: "Bus rapid transit in Cape Town and Johannesburg." }],
    rides: [uber("za"), bolt] },
};

export async function seedWorld(prisma: PrismaClient) {
  let countries = 0;
  for (const [iso, c] of Object.entries(WORLD)) {
    const country = await prisma.country.findUnique({ where: { isoCode: iso }, select: { id: true } });
    if (!country) continue;
    countries++;
    const countryId = country.id;
    for (const name of [...c.sims, ...(c.mvno ?? [])]) {
      const data = { isMvno: (c.mvno ?? []).includes(name), whereToBuy: c.simWhere, documentsNeeded: c.simDocs };
      await prisma.simProvider.upsert({ where: { countryId_name: { countryId, name } }, update: data, create: { ...data, countryId, name } });
    }
    for (const [i, t] of c.transit.entries()) {
      const data = { title: t.title, description: t.description, howToBuy: t.howToBuy ?? null, apps: t.apps ?? null, position: i };
      await prisma.transportMode.upsert({ where: { countryId_mode: { countryId, mode: t.mode } }, update: data, create: { ...data, countryId, mode: t.mode } });
    }
    for (const [position, r] of c.rides.entries()) {
      const data = { kind: r.kind, website: r.website, deepLink: r.deepLink ?? null, notes: r.notes ?? null, position };
      await prisma.rideService.upsert({ where: { countryId_name: { countryId, name: r.name } }, update: data, create: { ...data, countryId, name: r.name } });
    }
  }
  console.log(`  world basics: SIM operators, transport and ride apps for ${countries} countries`);
}
