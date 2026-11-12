import type { GuideCategory, PrismaClient } from "@prisma/client";

/**
 * Complete settling-in content for Switzerland. Everything here is data: the guide pages
 * render whatever rows exist for a country, so another country only needs new rows.
 * Prices are indicative (2025/26) and every article carries a source.
 */

type Article = { slug: string; category: GuideCategory; title: string; summary: string; body: string; sourceName: string; sourceUrl: string };

export const CH_ARTICLES: Article[] = [
  {
    slug: "first-week",
    category: "BASICS",
    title: "Your first week in Switzerland",
    summary: "The order to do things in: register, insure, bank, phone, travel pass.",
    sourceName: "ch.ch – Swiss authorities online",
    sourceUrl: "https://www.ch.ch/en/moving-to-switzerland/",
    body: `Switzerland runs on paperwork done in the right order. Most offices want proof of the previous step, so follow this sequence.

## 1. Register with your commune (Gemeinde / commune)
Within **14 days** of arriving, go to the residents' office (*Einwohnerkontrolle*, *contrôle des habitants*) of the municipality where you live. Bring your passport, rental contract, passport photos, and for students your admission letter. Non-EU citizens also need the entry visa (type D). You will later receive your residence permit card (L, B or student B).

## 2. Health insurance (within 3 months)
Basic health insurance is **mandatory** for everyone living here more than three months. Cover starts retroactively from your arrival date, so choose quickly. See the *Healthcare* section for how the deductible works.

## 3. Open a bank account
Your landlord and employer will want a Swiss IBAN. Students can get free accounts at PostFinance, cantonal banks and app banks. Bring your passport and proof of address (registration certificate).

## 4. Get a Swiss SIM card
Prepaid SIMs need your passport for registration (a legal requirement). Look at the MVNOs for good value.

## 5. Sort out transport
If you take the train more than a couple of times a month, a **Half Fare card** pays for itself quickly. Commuters in a city usually buy a monthly zone pass.

## 6. Liability insurance
Private liability insurance (*Privathaftpflicht*) costs around CHF 60–120 a year and most landlords expect it.`,
  },
  {
    slug: "health-insurance",
    category: "HEALTHCARE",
    title: "How Swiss health insurance works",
    summary: "Mandatory basic cover, the franchise (deductible) and the 10% co-pay, explained simply.",
    sourceName: "Federal Office of Public Health (FOPH)",
    sourceUrl: "https://www.bag.admin.ch/bag/en/home/versicherungen/krankenversicherung.html",
    body: `Everyone who lives in Switzerland must have **basic health insurance** (*Grundversicherung / LAMal*) from a private insurer. The cover is identical at every insurer by law; only the price and service differ.

## The three numbers that matter
- **Monthly premium** – what you pay every month, whether you are sick or not.
- **Franchise (deductible)** – you pay your medical bills yourself until this amount is reached each year. Adults choose between CHF 300 and CHF 2,500.
- **Co-payment (Selbstbehalt)** – after the franchise, you still pay 10% of costs, capped at CHF 700 per year for adults.

**Rule of thumb:** healthy and rarely see a doctor? Choose the CHF 2,500 franchise for the lowest premium. Expect regular treatment? CHF 300 is safer.

## Models that lower the premium
- *Family doctor (HMO/GP) model* – you always see your GP first.
- *Telmed* – you call a medical hotline before going to a doctor.

## Students
Some cantons let EU/EFTA students with a European Health Insurance Card (EHIC) apply for an exemption. Non-EU students may qualify for special student insurance accepted by their canton. Ask your canton's health insurance office before you buy.

## Compare
Use the official premium calculator at priminfo.admin.ch to compare insurers for your postcode.`,
  },
  {
    slug: "find-a-doctor",
    category: "HEALTHCARE",
    title: "Doctors, pharmacies and emergencies",
    summary: "Finding a GP, when to go to a pharmacy, and which number to call.",
    sourceName: "FMH – Swiss Medical Association",
    sourceUrl: "https://www.doctorfmh.ch/",
    body: `## Family doctor (Hausarzt / médecin de famille)
Register with a GP early: many practices are full. Search on doctorfmh.ch by postcode and language. Bring your insurance card to every visit.

## Pharmacies (Apotheke / pharmacie)
Pharmacists can treat minor problems and sell many medicines without prescription. Every region has an on-duty pharmacy at night and on Sundays (*Notfallapotheke*) – the number is posted on every pharmacy door.

## Emergencies
- **144** ambulance, **117** police, **118** fire, **112** general European number.
- **145** poison information, **1414** Rega air rescue.
- For urgent but not life-threatening problems, call your GP or the cantonal medical hotline (*Ärztefon* in Zurich: 0800 33 66 55) before going to A&E.

Use the *Nearby essentials* tab to see hospitals, clinics and pharmacies around your home.`,
  },
  {
    slug: "money-and-banking",
    category: "MONEY",
    title: "Money, banks and paying",
    summary: "Swiss francs, student accounts, TWINT, ATM fees and tipping.",
    sourceName: "Swiss Bankers Association",
    sourceUrl: "https://www.swissbanking.ch/en",
    body: `The currency is the **Swiss franc (CHF)**. Some shops near borders accept euros, but change is given in francs at a poor rate.

## Accounts
- **PostFinance** – everywhere, free for students and young people.
- **Cantonal banks** (ZKB, BCV, BCGE …) – local, good student packages.
- **App banks** (neon, Yuh, Zak) – cheap, fast to open with your permit.

## Paying
Cards work almost everywhere. **TWINT** is the Swiss payment app: used for splitting bills in shared flats, paying in small shops and at markets. Connect it to your Swiss account.

## ATMs
Withdrawing from your own bank's ATMs is free; other banks' ATMs can charge CHF 2 or more for some accounts.

## Tipping
Service is included in prices by law. Rounding up or leaving 5–10% for good service is appreciated but never required.

## Bills
Invoices often come as a **QR-bill** you scan in your banking app. Pay within the stated period (usually 30 days) to avoid reminder fees.`,
  },
  {
    slug: "groceries-and-daily-life",
    category: "GROCERIES",
    title: "Groceries, opening hours and recycling",
    summary: "Which supermarkets are cheap, Sunday closure, waste bags and quiet hours.",
    sourceName: "Swiss Federal Office for the Environment (FOEN)",
    sourceUrl: "https://www.bafu.admin.ch/bafu/en/home/topics/waste.html",
    body: `## Supermarkets
Discounters (Aldi, Lidl, Denner) are cheapest; Migros and Coop have the biggest choice and own-brand budget lines (*M-Budget*, *Prix Garantie*). See the table on this page for price tiers.

## Opening hours
Shops usually open **08:00–19:00/20:00, Monday to Saturday**, with longer hours on one late-shopping day. **Almost everything is closed on Sundays** and public holidays – except shops in large train stations, airports and petrol stations.

## Waste and recycling
- In many cantons household rubbish must go in **official fee bags** (*Gebührensack*) sold at supermarkets. Ordinary bags can be fined.
- PET bottles, glass, aluminium and batteries go back to supermarket collection points – for free.
- Paper and cardboard are **bundled and tied with string** and put out on collection days. Check your commune's waste calendar (often an app).

## Quiet hours
Most house rules (*Hausordnung*) set quiet hours from **22:00 to 07:00** and on Sundays. Avoid laundry, drilling and loud music then. Laundry rooms often have a booking schedule.`,
  },
  {
    slug: "renting-a-home",
    category: "HOUSING",
    title: "Renting a flat or a room",
    summary: "Deposits, applications, contracts, shared-flat etiquette and how to avoid scams.",
    sourceName: "Swiss Tenants' Association (MV/ASLOCA)",
    sourceUrl: "https://www.mieterverband.ch/",
    body: `## Applying
The market in Zurich, Geneva, Lausanne and Zug is very tight. Landlords ask for an application form, a copy of your permit and a **debt-collection extract** (*Betreibungsauszug*, about CHF 20 from the debt enforcement office). New arrivals can explain they just arrived.

## Deposit
Legally at most **three months' rent**. It must be paid into a blocked rent-deposit account in your name (or replaced by a deposit insurance). Never hand over the deposit in cash.

## The contract
Check the notice period (often 3 months, to specific dates), what is included in *Nebenkosten* (service charges), and whether subletting is allowed. Do a written **handover protocol** with photos when you move in.

## Shared flats (WG / colocation)
Agree on cleaning rotas, shared costs (internet, cleaning supplies) and quiet hours early. Use TWINT or a shared spreadsheet for expenses.

## Scams to avoid
- Never pay before viewing the place or meeting the landlord.
- "I'm abroad, I'll send the keys after you transfer the deposit" is always a scam.
- Rent far below market price + pressure to decide quickly = red flag.
- On Nira, keep all contact inside the in-app chat; never share passport scans before a viewing.`,
  },
  {
    slug: "permits-and-admin",
    category: "LEGAL",
    title: "Permits, registration and admin",
    summary: "L and B permits, student permits, driving licence exchange and official links.",
    sourceName: "State Secretariat for Migration (SEM)",
    sourceUrl: "https://www.sem.admin.ch/sem/en/home.html",
    body: `## Permits
- **EU/EFTA citizens** register at the commune and receive an **L** (short stay, < 1 year) or **B** (residence) permit based on their contract.
- **Non-EU citizens** need a national visa (type D) before travelling and receive a permit after registering. Students get a B permit tied to their studies, usually allowing up to 15 hours of work a week during term.

## Changes
Report a new address within 14 days, and tell the commune when you leave Switzerland (*Abmeldung*).

## Driving licence
Foreign licences must be exchanged for a Swiss one **within 12 months** of arrival at the cantonal road traffic office.

## Languages and culture
Switzerland has four national languages. German-speaking regions use Swiss German day to day, but standard German, French or English work in shops and offices. Punctuality is taken seriously; greet shop staff when you enter and leave.

## Useful official links
- ch.ch – general guide for residents
- sem.admin.ch – permits and visas
- priminfo.admin.ch – health insurance premiums`,
  },
  {
    slug: "public-transport-basics",
    category: "TRANSPORT",
    title: "Getting around by public transport",
    summary: "One ticket system for trains, trams, buses and boats – how to buy and validate.",
    sourceName: "SBB CFF FFS",
    sourceUrl: "https://www.sbb.ch/en",
    body: `Swiss public transport is integrated: one ticket covers trains, trams, buses and many boats within its zones.

## Buying tickets
- **SBB Mobile app** – every ticket in the country, plus timetables and live delays.
- **Local apps** (ZVV, TPG, TL…) – city zone tickets.
- **Ticket machines** at stations and most tram stops.

## Validate before boarding
There are no barriers, but inspectors check often. Riding without a valid ticket costs **CHF 90 or more**. Buy before you board; mobile tickets must be bought before departure.

## Saving money
- **Half Fare card** – 50% off almost all tickets for a year.
- **Supersaver tickets** – cheaper fixed-train tickets in the SBB app.
- **Day passes** for unplanned travel days.

## Cycling and walking
Bike lanes are common in cities; bikes need lights at night and must follow traffic rules. Pedestrians have priority at zebra crossings – drivers stop, but make eye contact first.`,
  },
  {
    slug: "sim-cards",
    category: "SIM",
    title: "SIM cards and mobile plans",
    summary: "The three networks, cheaper MVNOs, prepaid vs postpaid and what to bring.",
    sourceName: "Federal Office of Communications (OFCOM)",
    sourceUrl: "https://www.bakom.admin.ch/bakom/en/homepage.html",
    body: `Switzerland has three networks – **Swisscom**, **Sunrise** and **Salt** – and many cheaper brands (MVNOs) that use them.

## Prepaid or subscription?
- **Prepaid**: no contract, top up at supermarkets and kiosks. Best for tourists and your first weeks.
- **Postpaid** (subscription): better value for unlimited data; needs a Swiss address and sometimes a residence permit.

## What to bring
By law every SIM must be registered: bring your **passport or ID**. eSIMs can often be activated online with a video ID check.

## Tips
- Students: look for youth/student discounts at the big three, or simply pick an MVNO.
- Tourists: a prepaid data pack is usually cheaper than roaming; check whether EU roaming is included before crossing borders.
- Compare the plans in the table on this page; prices are indicative.`,
  },
];

export const CH_CHECKLIST: { title: string; description: string; category: GuideCategory; dueWithinDays?: number; link?: string }[] = [
  { title: "Register with your commune", description: "Go to the residents' office (Einwohnerkontrolle) with passport, rental contract and photos.", category: "LEGAL", dueWithinDays: 14, link: "https://www.ch.ch/en/moving-to-switzerland/" },
  { title: "Choose basic health insurance", description: "Mandatory within 3 months. Compare premiums for your postcode on priminfo.admin.ch.", category: "HEALTHCARE", dueWithinDays: 90, link: "https://www.priminfo.admin.ch/" },
  { title: "Open a Swiss bank account", description: "Needed for rent and salary. Students: PostFinance, cantonal banks or app banks.", category: "MONEY", dueWithinDays: 21 },
  { title: "Get a Swiss SIM card", description: "Bring your passport; prepaid is fine for the first weeks.", category: "SIM", dueWithinDays: 3 },
  { title: "Buy a Half Fare card or zone pass", description: "Half Fare = 50% off most tickets for a year. Commuters: monthly city zone pass.", category: "TRANSPORT", dueWithinDays: 7, link: "https://www.sbb.ch/en/travelcards-and-tickets/railpasses/half-fare-travelcard.html" },
  { title: "Collect your residence permit", description: "You will be invited to give biometrics, then receive the permit card by post.", category: "LEGAL", dueWithinDays: 60 },
  { title: "Get private liability insurance", description: "Around CHF 60–120 per year; most landlords expect it.", category: "HOUSING", dueWithinDays: 30 },
  { title: "Set up TWINT", description: "The Swiss payment app for splitting bills in shared flats.", category: "MONEY", dueWithinDays: 21 },
  { title: "Find a family doctor", description: "Many practices are full – register before you get sick.", category: "HEALTHCARE", dueWithinDays: 60, link: "https://www.doctorfmh.ch/" },
  { title: "Learn your waste and recycling days", description: "Buy official fee bags and check your commune's collection calendar.", category: "GROCERIES", dueWithinDays: 7 },
  { title: "Do the handover protocol for your flat", description: "Photograph every defect and get it signed, so you get your deposit back.", category: "HOUSING", dueWithinDays: 3 },
  { title: "Exchange your foreign driving licence", description: "Only if you drive: within 12 months at the cantonal road traffic office.", category: "LEGAL", dueWithinDays: 365 },
];

export const CH_SIM: {
  name: string; isMvno: boolean; network?: string; website: string; whereToBuy: string; documentsNeeded: string; studentTip?: string; touristTip?: string;
  plans: { name: string; kind: "PREPAID" | "POSTPAID"; priceMonthly: number; dataGb: number | null; euRoaming?: boolean; notes?: string }[];
}[] = [
  {
    name: "Swisscom", isMvno: false, website: "https://www.swisscom.ch/en/", whereToBuy: "Swisscom shops, Coop, kiosks, online (eSIM)", documentsNeeded: "Passport or ID; Swiss address for subscriptions",
    studentTip: "Youth plans (under 26) are discounted.", touristTip: "Prepaid travel data packs available at airports.",
    plans: [
      { name: "inOne mobile prepaid", kind: "PREPAID", priceMonthly: 29.9, dataGb: 10, notes: "Pay per period; top up anywhere." },
      { name: "blue Mobile M", kind: "POSTPAID", priceMonthly: 65, dataGb: null, euRoaming: true, notes: "Unlimited in Switzerland, roaming included." },
    ],
  },
  {
    name: "Sunrise", isMvno: false, website: "https://www.sunrise.ch/en/", whereToBuy: "Sunrise shops, kiosks, online (eSIM)", documentsNeeded: "Passport or ID",
    studentTip: "Young (under 27) subscriptions are cheaper.",
    plans: [
      { name: "Prepaid Daily", kind: "PREPAID", priceMonthly: 25, dataGb: null, notes: "Daily flat rate charged only on days you use it." },
      { name: "Up Mobile Basic", kind: "POSTPAID", priceMonthly: 50, dataGb: null, euRoaming: true },
    ],
  },
  {
    name: "Salt", isMvno: false, website: "https://www.salt.ch/en", whereToBuy: "Salt stores, kiosks, online", documentsNeeded: "Passport or ID",
    plans: [
      { name: "Prepaid Swiss", kind: "PREPAID", priceMonthly: 24.95, dataGb: 5 },
      { name: "Swiss Unlimited", kind: "POSTPAID", priceMonthly: 49.95, dataGb: null },
    ],
  },
  {
    name: "Wingo", isMvno: true, network: "Swisscom", website: "https://www.wingo.ch/en", whereToBuy: "Online only (eSIM or SIM by post)", documentsNeeded: "Passport or ID, Swiss address",
    studentTip: "Online-only brand on the Swisscom network at a much lower price.",
    plans: [{ name: "Wingo Swiss", kind: "POSTPAID", priceMonthly: 29.95, dataGb: null, notes: "Unlimited in Switzerland." }],
  },
  {
    name: "Yallo", isMvno: true, network: "Sunrise", website: "https://www.yallo.ch/en", whereToBuy: "Online, Manor, kiosks", documentsNeeded: "Passport or ID",
    touristTip: "Prepaid starter packs are sold at kiosks.",
    plans: [
      { name: "Yallo Prepaid", kind: "PREPAID", priceMonthly: 15, dataGb: 3 },
      { name: "Swiss Flat", kind: "POSTPAID", priceMonthly: 29, dataGb: null },
    ],
  },
  {
    name: "Lebara", isMvno: true, website: "https://www.lebara.ch/en", whereToBuy: "Online, kiosks, Denner", documentsNeeded: "Passport or ID",
    touristTip: "Cheap international calls – popular for calling home.",
    plans: [{ name: "Prepaid 28 days", kind: "PREPAID", priceMonthly: 19.9, dataGb: 20, notes: "Renews every 28 days if topped up." }],
  },
];

export const CH_TRANSPORT_MODES: { mode: "TRAIN" | "TRAM" | "BUS" | "BOAT" | "CABLE_CAR" | "BIKE" | "WALK"; title: string; description: string; howToBuy?: string; apps?: string; priceRange?: string }[] = [
  { mode: "TRAIN", title: "Trains (SBB and regional railways)", description: "Dense, punctual network with trains every 30 minutes or better between most cities. Seats are not reserved on domestic trains.", howToBuy: "SBB Mobile app, ticket machines, station counters.", apps: "SBB Mobile", priceRange: "Zurich–Bern ~CHF 56 full fare, ~CHF 28 with Half Fare" },
  { mode: "TRAM", title: "Trams", description: "The backbone of transport in Zurich, Basel, Bern and Geneva. Covered by city zone tickets.", howToBuy: "Machines at stops or the local app – buy before boarding.", apps: "ZVV, BVB/TNW, Bernmobil, TPG", priceRange: "Single CHF 2.80–4.60; day pass CHF 8–14" },
  { mode: "BUS", title: "Buses and PostBus", description: "City buses plus yellow PostBuses that reach almost every village and mountain pass.", howToBuy: "Same tickets as trams in cities; PostBus via SBB app.", apps: "SBB Mobile, PostBus", priceRange: "Zone-based" },
  { mode: "BOAT", title: "Lake boats", description: "Regular boats on Lake Zurich, Geneva, Lucerne and Lugano – some are included in zone passes and in the GA.", howToBuy: "At the pier or in the SBB app.", priceRange: "Short hops in zone passes; cruises CHF 20–70" },
  { mode: "CABLE_CAR", title: "Cable cars and mountain railways", description: "Gondolas and cogwheel railways to viewpoints. Rarely included in passes, but Half Fare often gives 50% off.", priceRange: "CHF 20–120 return" },
  { mode: "BIKE", title: "Cycling", description: "Bike-sharing (PubliBike, Züri Velo) in many cities. Lights at night are compulsory; ride on the right and use bike lanes.", apps: "PubliBike, Donkey Republic", priceRange: "From CHF 1–3 per ride" },
  { mode: "WALK", title: "Walking", description: "City centres are compact and walkable. Cross at zebra crossings; drivers stop for pedestrians.", priceRange: "Free" },
];

export const CH_PASSES: { name: string; description: string; price: number | null; validity: string; audience: "EVERYONE" | "YOUTH" | "STUDENT" | "TOURIST" | "SENIOR"; url?: string; city?: string }[] = [
  { name: "Half Fare card (Halbtax)", description: "Pay half price on almost all trains, buses, trams, boats and many mountain railways.", price: 190, validity: "1 year", audience: "EVERYONE", url: "https://www.sbb.ch/en/travelcards-and-tickets/railpasses/half-fare-travelcard.html" },
  { name: "GA travelcard (adult, 2nd class)", description: "Unlimited travel on almost all public transport in Switzerland.", price: 3995, validity: "1 year", audience: "EVERYONE", url: "https://www.sbb.ch/en/travelcards-and-tickets/railpasses/ga.html" },
  { name: "GA travelcard Youth (2nd class)", description: "Discounted GA for people aged 16 to 25 – the best deal for students who travel a lot.", price: 2780, validity: "1 year", audience: "YOUTH", url: "https://www.sbb.ch/en/travelcards-and-tickets/railpasses/ga.html" },
  { name: "Swiss Travel Pass (3 days)", description: "For visitors living abroad: unlimited trains, buses and boats plus free entry to 500+ museums.", price: 244, validity: "3 consecutive days", audience: "TOURIST", url: "https://www.mystsnet.com/" },
  { name: "Swiss Travel Pass (8 days)", description: "Longer version of the visitor pass, includes most mountain discounts.", price: 419, validity: "8 consecutive days", audience: "TOURIST" },
  { name: "Saver day pass", description: "Day pass for the whole country bought in advance – the earlier, the cheaper.", price: 52, validity: "1 day", audience: "EVERYONE" },
  { name: "ZVV NetzPass zone 110 (Zurich city)", description: "Monthly pass for trams, buses, trains and boats inside the city of Zurich.", price: 92, validity: "1 month", audience: "EVERYONE", url: "https://www.zvv.ch/", city: "Zürich" },
  { name: "ZVV 24-hour ticket zone 110", description: "24 hours of unlimited travel in the city of Zurich.", price: 8.8, validity: "24 hours", audience: "EVERYONE", city: "Zürich" },
  { name: "Unireso monthly (Geneva, zone 10)", description: "Monthly pass for Geneva's trams, buses, trains and lake shuttles.", price: 70, validity: "1 month", audience: "EVERYONE", city: "Genève" },
];

export const CH_SUPERMARKETS = [
  { name: "Aldi Suisse", priceTier: 1, notes: "Discounter, limited range, lowest prices.", website: "https://www.aldi-suisse.ch/" },
  { name: "Lidl", priceTier: 1, notes: "Discounter with good bakery section.", website: "https://www.lidl.ch/" },
  { name: "Denner", priceTier: 1, notes: "Migros-owned discounter, many small branches.", website: "https://www.denner.ch/" },
  { name: "Migros", priceTier: 2, notes: "Largest chain, cooperative; M-Budget line is cheap. Sells no alcohol or tobacco.", website: "https://www.migros.ch/" },
  { name: "Coop", priceTier: 3, notes: "Large range incl. Prix Garantie budget line; many stations have Coop Pronto.", website: "https://www.coop.ch/" },
  { name: "Volg", priceTier: 3, notes: "Village shops, convenient but pricier.", website: "https://www.volg.ch/" },
  { name: "Manor Food / Globus", priceTier: 4, notes: "Department-store food halls, premium products.", website: "https://www.manor.ch/" },
];

export const CH_BANKS = [
  { name: "PostFinance", kind: "Postal bank", studentAccount: true, monthlyFee: 0, notes: "Free for under-26s; accounts at every post office.", website: "https://www.postfinance.ch/" },
  { name: "UBS", kind: "Big bank", studentAccount: true, monthlyFee: 0, notes: "Free youth package for students under 26.", website: "https://www.ubs.com/ch/" },
  { name: "Zürcher Kantonalbank", kind: "Cantonal bank", studentAccount: true, monthlyFee: 0, notes: "Free student account in the canton of Zurich.", website: "https://www.zkb.ch/" },
  { name: "Raiffeisen", kind: "Cooperative bank", studentAccount: true, monthlyFee: 0, notes: "Branches in small towns and villages.", website: "https://www.raiffeisen.ch/" },
  { name: "neon", kind: "App bank", studentAccount: false, monthlyFee: 0, notes: "Free account, card without foreign fees.", website: "https://www.neon-free.ch/" },
  { name: "Yuh", kind: "App bank", studentAccount: false, monthlyFee: 0, notes: "By PostFinance and Swissquote; multi-currency.", website: "https://www.yuh.com/" },
];

export async function seedSwissGuide(prisma: PrismaClient) {
  const ch = await prisma.country.findUniqueOrThrow({ where: { isoCode: "CH" }, select: { id: true } });
  const countryId = ch.id;

  for (const [i, a] of CH_ARTICLES.entries()) {
    await prisma.guideArticle.upsert({
      where: { countryId_slug: { countryId, slug: a.slug } },
      update: { ...a, position: i },
      create: { ...a, countryId, position: i },
    });
  }
  for (const [i, c] of CH_CHECKLIST.entries()) {
    await prisma.checklistTemplate.upsert({
      where: { countryId_title: { countryId, title: c.title } },
      update: { ...c, position: i },
      create: { ...c, countryId, position: i },
    });
  }
  for (const p of CH_SIM) {
    const { plans, ...provider } = p;
    const row = await prisma.simProvider.upsert({
      where: { countryId_name: { countryId, name: p.name } },
      update: provider,
      create: { ...provider, countryId },
    });
    for (const plan of plans) {
      await prisma.simPlan.upsert({
        where: { providerId_name: { providerId: row.id, name: plan.name } },
        update: { ...plan, currency: "CHF" },
        create: { ...plan, currency: "CHF", providerId: row.id },
      });
    }
  }
  for (const [i, m] of CH_TRANSPORT_MODES.entries()) {
    await prisma.transportMode.upsert({
      where: { countryId_mode: { countryId, mode: m.mode } },
      update: { ...m, position: i },
      create: { ...m, countryId, position: i },
    });
  }
  for (const p of CH_PASSES) {
    const { city, ...pass } = p;
    const cityId = city ? (await prisma.city.findFirst({ where: { name: city, countryId }, select: { id: true } }))?.id ?? null : null;
    await prisma.transportPass.upsert({
      where: { countryId_name: { countryId, name: p.name } },
      update: { ...pass, cityId, currency: "CHF" },
      create: { ...pass, cityId, currency: "CHF", countryId },
    });
  }
  for (const s of CH_SUPERMARKETS) {
    await prisma.supermarketChain.upsert({ where: { countryId_name: { countryId, name: s.name } }, update: s, create: { ...s, countryId } });
  }
  for (const b of CH_BANKS) {
    await prisma.bank.upsert({ where: { countryId_name: { countryId, name: b.name } }, update: { ...b, currency: "CHF" }, create: { ...b, currency: "CHF", countryId } });
  }
  console.log(`  Swiss guide: ${CH_ARTICLES.length} articles, ${CH_CHECKLIST.length} checklist items, ${CH_SIM.length} SIM providers, ${CH_PASSES.length} passes`);
}
