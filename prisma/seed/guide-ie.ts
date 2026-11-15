import type { GuideCategory, PrismaClient } from "@prisma/client";
import { findCity } from "./locations";

/**
 * Settling-in content for Ireland with Dublin-specific transport and housing. Prices are
 * indicative (2025/26) and change often – every article carries a source to check.
 */
type Article = { slug: string; category: GuideCategory; title: string; summary: string; body: string; sourceName: string; sourceUrl: string };

const ARTICLES: Article[] = [
  {
    slug: "first-week",
    category: "BASICS",
    title: "Your first week in Ireland",
    summary: "Immigration registration, a SIM, a Leap Card, a bank account and a PPS number – in the order you need them.",
    sourceName: "Citizens Information",
    sourceUrl: "https://www.citizensinformation.ie/en/moving-country/moving-to-ireland/",
    body: `## 1. Get connected on day one
Prepaid SIM cards need **no ID** in Ireland. Buy one at the airport, a phone shop or a supermarket and top up in the app. See *SIM cards* below.

## 2. Get a Leap Card
Dublin's buses, the Luas tram, DART and commuter trains all take the **TFI Leap Card**, which is noticeably cheaper than cash. Full-time students should order a **Student Leap Card** for discounted fares.

## 3. Register with immigration (non-EU/EEA)
If you are from outside the EU/EEA/Switzerland/UK and staying **more than 90 days**, you must register and get an **Irish Residence Permit (IRP)** before the landing stamp in your passport expires. Book the appointment online as early as you can – slots in Dublin fill up.

## 4. Open a bank account
You need photo ID and proof of an Irish address (a letter from your university usually works for students). App banks such as Revolut are quick to open while you wait.

## 5. Apply for a PPS number
The **Personal Public Service number** is needed to work, pay the right tax and use public services. Apply online at MyWelfare.ie once you have an address and a reason (for example a job offer).

## 6. Find a home
Dublin's rental market is tight. Start before you arrive, never pay a deposit for a place you (or someone you trust) haven't seen, and check that the tenancy is registered with the RTB.`,
  },
  {
    slug: "immigration-registration",
    category: "LEGAL",
    title: "Irish Residence Permit (IRP) and student permission",
    summary: "Who must register, what to bring, Stamp 2 work rules and renewals.",
    sourceName: "Immigration Service Delivery, Department of Justice",
    sourceUrl: "https://www.irishimmigration.ie/registering-your-immigration-permission/",
    body: `## Who registers
Non-EU/EEA nationals staying longer than **90 days** must register their permission and receive an **IRP card**. People living in Dublin register at the **Burgh Quay Registration Office** (appointment only); elsewhere registration is being moved to the same national service – check the official site for your county.

## What students usually bring
- Passport and (if required) your study visa
- Letter of enrolment from your college and proof that fees are paid
- Proof of **private medical insurance**
- Evidence of funds as set out in the current student guidelines
- The registration fee (about **€300**, paid by card)

## Stamp 2 (full-time students)
Students on **Stamp 2** may take casual work of up to **20 hours a week during term** and up to **40 hours a week** in the holiday periods set by the Department (June–September and 15 December–15 January).

## Renewals
Renew online before the card expires. Graduates of Irish degrees can usually apply for the **Third Level Graduate Programme (Stamp 1G)** to stay and work.

Rules change – always confirm on irishimmigration.ie before your appointment.`,
  },
  {
    slug: "sim-cards",
    category: "SIM",
    title: "SIM cards and mobile data in Ireland",
    summary: "Vodafone, Three and Eir plus cheaper brands such as GoMo, 48 and Tesco Mobile – no ID needed for prepaid.",
    sourceName: "ComReg (Commission for Communications Regulation)",
    sourceUrl: "https://www.comreg.ie/compare/",
    body: `Ireland has three networks – **Vodafone**, **Three** and **Eir** – and several low-cost brands that run on them: **GoMo** (Eir), **48** (Three), **Tesco Mobile** (Three), **An Post Mobile** and **Lycamobile**.

## What to bring
Nothing for prepaid: there is **no ID requirement**. Bill-pay contracts need ID, an Irish bank account and proof of address.

## How it works
- Prepaid plans renew every **28 or 30 days**; most include unlimited or very large data, calls and texts, and EU roaming.
- Top up in the operator's app, online or with a voucher from any shop.
- **eSIM** is available from the main operators and several of the low-cost brands.
- Keep your Indian number for bank OTPs by switching it to a low-cost roaming or long-validity plan before you fly.

## Tips
- SIM-only brands (GoMo, 48) are usually the cheapest for students.
- Coverage around Dublin and the UCD/Trinity/DCU campuses is good on all three networks.
- Compare plans on the regulator's site before you choose.`,
  },
  {
    slug: "getting-around-dublin",
    category: "TRANSPORT",
    title: "Getting around Dublin",
    summary: "Leap Card, Dublin Bus, Luas, DART, the airport coaches and how to reach UCD.",
    sourceName: "Transport for Ireland",
    sourceUrl: "https://www.transportforireland.ie/",
    body: `## Leap Card
Buy a **TFI Leap Card** at the airport, in newsagents or online, and top it up in the *Leap Top-Up* app. Tap on (and off on Luas, DART and trains). With Leap you get the **TFI 90-minute fare**: one low fare covers changes between bus, Luas and DART inside Dublin for 90 minutes, and daily/weekly **caps** stop you overpaying.

## Student and Young Adult cards
Full-time students and anyone aged 19–25 can get a **Student / Young Adult Leap Card** with roughly **half-price** fares. Order it online with your student ID.

## Buses
Dublin Bus and Go-Ahead run the city network. Drivers **don't give change** – use Leap. The network is being renumbered under **BusConnects**, so check the **TFI Live** app for your route.

## Luas and DART
The **Luas** has two tram lines (Red and Green). The **DART** runs along the coast from Howth/Malahide to Greystones. Irish Rail connects Dublin with Cork, Galway, Limerick and Belfast.

## Getting to UCD (Belfield)
Frequent buses run along the **Stillorgan Road (N11)** corridor between the city centre and the UCD flyover stop, and several routes terminate inside the campus. Cycling from Ranelagh, Rathmines or Clonskeagh takes 10–20 minutes.

## From the airport
There is **no train** to Dublin Airport. Take **Dublin Express** or **Aircoach** coaches to the city, a Dublin Bus city route with your Leap Card, or a taxi (about 25–40 minutes to the south side).

## Taxis and apps
Taxis are metered. Book them with **FREENOW**, **Uber** or **Bolt** – in Ireland these apps book licensed taxis.`,
  },
  {
    slug: "healthcare",
    category: "HEALTHCARE",
    title: "Healthcare in Ireland",
    summary: "GPs, student health services, insurance for non-EU students, pharmacies and emergencies.",
    sourceName: "HSE (Health Service Executive)",
    sourceUrl: "https://www2.hse.ie/services/find-a-gp/",
    body: `## First stop: a GP
For anything that isn't an emergency you see a **GP** (family doctor). A visit typically costs **€50–70** unless you hold a medical or GP visit card. Many practices have waiting lists – register soon after you arrive.

## Students
Most universities run a **student health service** with reduced fees; UCD's is on the Belfield campus. Non-EU/EEA students need **private medical insurance** for immigration registration.

## Emergencies
- **112 or 999** – ambulance, fire, Gardaí (police), coast guard
- Going to an emergency department without a GP referral carries a charge (about €100).

## Out of hours
GP out-of-hours co-operatives cover evenings and weekends; your GP's voicemail gives the number.

## Pharmacies
Pharmacists give free advice for minor illnesses. Chains include Boots, McCabes and Hickey's. Prescriptions from abroad are not accepted – bring a letter and see an Irish GP.`,
  },
  {
    slug: "money-and-banking",
    category: "MONEY",
    title: "Money, banks and paying for things",
    summary: "Euro, opening an account, Revolut, sending money from India and tipping.",
    sourceName: "Competition and Consumer Protection Commission",
    sourceUrl: "https://www.ccpc.ie/consumers/money/banking/",
    body: `The currency is the **euro (EUR, €)**. Cards and contactless (including phones) are accepted almost everywhere.

## Bank account
The main banks are **AIB**, **Bank of Ireland** and **PTSB**; all have student accounts. You need photo ID and **proof of address** – a letter from your college confirming your Irish address is normally accepted. **Revolut** and **N26** open in minutes and are widely used for splitting rent and bills.

## Bringing money from India
Compare the rate and fee of your Indian bank's remittance (under the Liberalised Remittance Scheme), a forex card and transfer services before you send fees or living costs. Use the converter in Nira to check the live INR → EUR rate.

## Exchanging cash
Airport desks have the worst rates. Banks, An Post (post offices) and bureaux de change in the city centre are better – see *Money & exchange* in Nearby essentials.

## Tipping
Not expected for counter service; around 10 % in sit-down restaurants if service isn't included.`,
  },
  {
    slug: "groceries-and-daily-life",
    category: "GROCERIES",
    title: "Groceries and daily life",
    summary: "Supermarkets, Indian groceries, plugs, weather and bins.",
    sourceName: "Nira editorial",
    sourceUrl: "https://www.citizensinformation.ie/en/consumer/",
    body: `## Supermarkets
**Lidl** and **Aldi** are the cheapest; **Tesco**, **Dunnes Stores** and **SuperValu** are mid-priced with loyalty cards worth having; **Marks & Spencer** is premium. Most deliver.

## Indian and Asian groceries
Dublin has many Asian supermarkets and Indian grocery shops, especially around the city centre and the south side – spices, atta, dal and rice are easy to find.

## Power and plugs
230 V with **type G** three-pin plugs (the same as the UK). Bring an adapter for Indian chargers.

## Weather
Mild but changeable – carry a waterproof jacket year-round rather than an umbrella.

## Waste and recycling
Households separate general waste, recycling and (often) food waste. There is a deposit on plastic bottles and cans – return them to the machines in supermarkets to get it back.

## Tap water
Safe to drink.`,
  },
  {
    slug: "renting-a-home",
    category: "HOUSING",
    title: "Renting in Dublin",
    summary: "Student residences, house shares and digs, deposits, your rights and how to avoid scams.",
    sourceName: "Residential Tenancies Board",
    sourceUrl: "https://www.rtb.ie/",
    body: `## Types of homes
- **Purpose-built student accommodation** on or near campus (UCD Residences, private student halls)
- **House or flat shares** – a room in a shared home, the most common option
- **Digs** – a room in a family home, sometimes with meals, often Monday–Friday
- Studios and one-bed flats, which are scarce and expensive

## Costs and deposit
Expect to pay **one month's rent as a deposit** plus the first month in advance. Bills (electricity, gas, internet, bins) are often extra.

## Your rights
Tenancies must be **registered with the RTB**. Most of Dublin is a **Rent Pressure Zone** where rent increases are capped. You are entitled to a rent book or written record of payments.

## Avoid scams
- Never pay before a viewing (in person or by a trusted friend), and never by untraceable transfer.
- Be wary of "landlords abroad" and prices far below the market.
- Keep contact inside Nira until you have met.

## Where students live near UCD
Clonskeagh, Goatstown, Stillorgan, Donnybrook, Ranelagh, Rathmines and Dundrum are all within a short bus or cycle ride of Belfield.`,
  },
  {
    slug: "working-and-pps",
    category: "LEGAL",
    title: "Working, PPS number and tax",
    summary: "Getting a PPS number, registering your job with Revenue and student work limits.",
    sourceName: "Department of Social Protection",
    sourceUrl: "https://www.gov.ie/en/service/12e6de-get-a-personal-public-service-pps-number/",
    body: `## PPS number
Apply online at **MyWelfare.ie** with your passport, proof of address and the reason you need it (for example a job offer). It arrives by post.

## Tax
Register your job on **Revenue's myAccount** so you are not put on emergency tax. Your payslip shows PAYE, PRSI and USC deductions.

## Student work limits
See *Irish Residence Permit* above for the Stamp 2 limits. Ireland has a national minimum wage; check the current rate on gov.ie.`,
  },
];

const CHECKLIST: { title: string; description: string; category: GuideCategory; dueWithinDays?: number; link?: string }[] = [
  { title: "Buy an Irish prepaid SIM", description: "No ID needed. Airport, phone shops or supermarkets; top up in the app.", category: "SIM", dueWithinDays: 1 },
  { title: "Get a TFI Leap Card", description: "Cheaper fares on bus, Luas and DART. Buy at the airport or any newsagent.", category: "TRANSPORT", dueWithinDays: 2, link: "https://about.leapcard.ie/" },
  { title: "Collect your student card and register with your college", description: "You need the enrolment letter for immigration, the bank and the Student Leap Card.", category: "BASICS", dueWithinDays: 7 },
  { title: "Book your immigration (IRP) appointment", description: "Non-EU/EEA nationals staying over 90 days. Book early – Dublin slots fill up.", category: "LEGAL", dueWithinDays: 14, link: "https://www.irishimmigration.ie/registering-your-immigration-permission/" },
  { title: "Order a Student Leap Card", description: "Roughly half-price public transport for full-time students.", category: "TRANSPORT", dueWithinDays: 14, link: "https://www.studentleapcard.ie/" },
  { title: "Open a bank account", description: "Photo ID plus proof of address (a college letter works). Revolut is quick in the meantime.", category: "MONEY", dueWithinDays: 21 },
  { title: "Register with a GP or the student health service", description: "Practices have waiting lists, so do it before you are sick.", category: "HEALTHCARE", dueWithinDays: 30 },
  { title: "Apply for a PPS number", description: "Needed to work and pay the right tax. Online at MyWelfare.ie.", category: "LEGAL", dueWithinDays: 30, link: "https://www.mywelfare.ie/" },
  { title: "Check your tenancy is registered with the RTB", description: "And get every rent and deposit payment in writing.", category: "HOUSING", dueWithinDays: 30, link: "https://www.rtb.ie/" },
  { title: "Install the transport and taxi apps", description: "TFI Live, Leap Top-Up, FREENOW and Uber.", category: "TRANSPORT", dueWithinDays: 3 },
];

const DOCS = "No ID needed for prepaid; bill-pay needs ID, an Irish bank account and proof of address";
const SIMS = [
  { name: "Vodafone", isMvno: false, website: "https://n.vodafone.ie/", whereToBuy: "Vodafone shops, airport, supermarkets", documentsNeeded: DOCS, touristTip: "Widest rural coverage.", plans: [{ name: "Prepaid 28 days · unlimited data", kind: "PREPAID" as const, priceMonthly: 20, dataGb: null }] },
  { name: "Three", isMvno: false, website: "https://www.three.ie/", whereToBuy: "Three shops, airport, supermarkets", documentsNeeded: DOCS, studentTip: "Popular with students for all-you-can-eat data.", plans: [{ name: "Prepaid 28 days · all-you-can-eat data", kind: "PREPAID" as const, priceMonthly: 20, dataGb: null }] },
  { name: "Eir", isMvno: false, website: "https://www.eir.ie/", whereToBuy: "Eir shops and online", documentsNeeded: DOCS, plans: [{ name: "Prepaid 28 days · unlimited data", kind: "PREPAID" as const, priceMonthly: 20, dataGb: null }] },
  { name: "GoMo", isMvno: true, website: "https://gomo.ie/", whereToBuy: "Online only – SIM by post or eSIM", documentsNeeded: "Irish payment card; no contract", studentTip: "Usually one of the cheapest SIM-only plans; runs on the Eir network.", plans: [{ name: "SIM only · 30 days · unlimited data", kind: "POSTPAID" as const, priceMonthly: 14.99, dataGb: null }] },
  { name: "48", isMvno: true, website: "https://48.ie/", whereToBuy: "Online – SIM by post or eSIM", documentsNeeded: "No ID; top up monthly", studentTip: "No-contract monthly membership on the Three network.", plans: [{ name: "Monthly membership · 100 GB", kind: "PREPAID" as const, priceMonthly: 12.99, dataGb: 100 }] },
  { name: "Tesco Mobile", isMvno: true, website: "https://www.tescomobile.ie/", whereToBuy: "Tesco supermarkets", documentsNeeded: DOCS, plans: [{ name: "Prepaid 28 days · 50 GB", kind: "PREPAID" as const, priceMonthly: 15, dataGb: 50 }] },
];

const MODES = [
  { mode: "BUS" as const, title: "Dublin Bus and TFI city buses", description: "The backbone of Dublin transport, including frequent routes along the Stillorgan Road to UCD. Drivers give no change – pay with a Leap Card. Routes are being renumbered under BusConnects.", howToBuy: "TFI Leap Card (tap on) or exact coins.", apps: "TFI Live, Leap Top-Up", priceRange: "€2 for 90 minutes with Leap (about half with a Student/Young Adult card)" },
  { mode: "TRAM" as const, title: "Luas tram", description: "Two lines: Green (north–south through the city centre, Ranelagh, Dundrum and Sandyford) and Red (east–west to Heuston and Tallaght). Tap on and off.", howToBuy: "Leap Card or ticket machines at stops.", apps: "TFI Live", priceRange: "Covered by the €2 TFI 90-minute fare" },
  { mode: "TRAIN" as const, title: "DART and Irish Rail", description: "DART electric trains follow the coast from Howth/Malahide to Greystones; Irish Rail intercity trains link Dublin with Cork, Galway, Limerick and Belfast.", howToBuy: "Leap Card for DART and commuter trains; book intercity tickets online for the best price.", apps: "Irish Rail, TFI Live", priceRange: "DART within the 90-minute fare; intercity from about €15 booked ahead" },
  { mode: "BIKE" as const, title: "Cycling and dublinbikes", description: "Dublin is compact and mostly flat. dublinbikes stations cover the city centre; many students cycle to UCD from Ranelagh, Rathmines and Clonskeagh.", howToBuy: "dublinbikes annual or short-term subscription in the app.", apps: "dublinbikes", priceRange: "First 30 minutes of each dublinbikes trip free" },
  { mode: "WALK" as const, title: "Walking", description: "The city centre is small and walkable. Traffic drives on the left – look right first.", priceRange: "Free" },
];

const PASSES = [
  { name: "TFI Leap Card", description: "Reusable smart card for bus, Luas, DART and commuter rail with cheaper fares and daily and weekly caps.", price: 5, validity: "Refundable card deposit; top up as needed", audience: "EVERYONE" as const, url: "https://about.leapcard.ie/" },
  { name: "Student / Young Adult Leap Card", description: "For full-time students and 19–25 year-olds: about half-price fares on TFI services plus retail discounts.", price: 10, validity: "Card fee; valid for the academic year or until you turn 26", audience: "STUDENT" as const, url: "https://www.studentleapcard.ie/" },
  { name: "TFI 90-minute fare", description: "One fare covers unlimited changes between Dublin city bus, Luas and most DART and commuter rail for 90 minutes.", price: 2, validity: "90 minutes", audience: "EVERYONE" as const, url: "https://www.transportforireland.ie/fares/tfi-90-minute-fare/" },
  { name: "Leap Visitor Card", description: "Unlimited travel on Dublin city bus, Luas, DART and commuter rail – handy for your first days.", price: 8, validity: "1 day (3- and 7-day versions available)", audience: "TOURIST" as const, url: "https://about.leapcard.ie/leap-visitor-card" },
  { name: "Airport coach (Dublin Express / Aircoach)", description: "Direct coaches between Dublin Airport and the city centre and south side.", price: 8, validity: "Single trip, cheaper booked online", audience: "EVERYONE" as const },
];

const MARKETS = [
  { name: "Lidl", priceTier: 1, notes: "Discount supermarket; cheapest weekly shop." },
  { name: "Aldi", priceTier: 1, notes: "Discount supermarket." },
  { name: "Tesco", priceTier: 2, notes: "Large range, Clubcard prices, home delivery." },
  { name: "Dunnes Stores", priceTier: 2, notes: "Irish chain; money-off vouchers on bigger shops." },
  { name: "SuperValu", priceTier: 3, notes: "Neighbourhood supermarkets with good fresh food." },
  { name: "Marks & Spencer", priceTier: 4, notes: "Premium food halls." },
];

const BANKS = [
  { name: "AIB", kind: "Retail bank", studentAccount: true, notes: "Student account with no maintenance fees; branches near the main campuses.", website: "https://aib.ie/" },
  { name: "Bank of Ireland", kind: "Retail bank", studentAccount: true, notes: "Has a branch on the UCD Belfield campus; student account.", website: "https://www.bankofireland.com/" },
  { name: "PTSB", kind: "Retail bank", studentAccount: true, notes: "Online account opening for residents.", website: "https://www.ptsb.ie/" },
  { name: "Revolut", kind: "App bank", studentAccount: false, notes: "Opens in minutes with ID; used everywhere for splitting rent and bills.", website: "https://www.revolut.com/en-IE/" },
  { name: "An Post Money", kind: "Post office", studentAccount: false, notes: "Current account and foreign exchange at post offices.", website: "https://www.anpost.com/Money" },
];

export async function seedIrelandGuide(prisma: PrismaClient) {
  const country = await prisma.country.findUnique({ where: { isoCode: "IE" }, select: { id: true } });
  if (!country) return;
  const countryId = country.id;
  const dublin = await findCity(prisma, "IE", "Dublin").catch(() => null);
  const dublinOnly = (slug: string) => (slug.includes("dublin") || slug === "renting-a-home" ? dublin?.id ?? null : null);

  for (const [i, a] of ARTICLES.entries()) {
    await prisma.guideArticle.upsert({ where: { countryId_slug: { countryId, slug: a.slug } }, update: { ...a, position: i, cityId: dublinOnly(a.slug) }, create: { ...a, countryId, position: i, cityId: dublinOnly(a.slug) } });
  }
  for (const [i, c] of CHECKLIST.entries()) {
    await prisma.checklistTemplate.upsert({ where: { countryId_title: { countryId, title: c.title } }, update: { ...c, position: i }, create: { ...c, countryId, position: i } });
  }
  for (const s of SIMS) {
    const { plans, ...p } = s;
    const row = await prisma.simProvider.upsert({ where: { countryId_name: { countryId, name: s.name } }, update: p, create: { ...p, countryId } });
    for (const plan of plans) {
      const data = { ...plan, currency: "EUR", notes: "Indicative price – check the operator's site" };
      await prisma.simPlan.upsert({ where: { providerId_name: { providerId: row.id, name: plan.name } }, update: data, create: { ...data, providerId: row.id } });
    }
  }
  for (const [i, m] of MODES.entries()) {
    await prisma.transportMode.upsert({ where: { countryId_mode: { countryId, mode: m.mode } }, update: { ...m, position: i }, create: { ...m, countryId, position: i } });
  }
  for (const p of PASSES) {
    const data = { ...p, cityId: dublin?.id ?? null, currency: "EUR" };
    await prisma.transportPass.upsert({ where: { countryId_name: { countryId, name: p.name } }, update: data, create: { ...data, countryId } });
  }
  for (const m of MARKETS) await prisma.supermarketChain.upsert({ where: { countryId_name: { countryId, name: m.name } }, update: m, create: { ...m, countryId } });
  for (const b of BANKS) await prisma.bank.upsert({ where: { countryId_name: { countryId, name: b.name } }, update: { ...b, currency: "EUR" }, create: { ...b, currency: "EUR", countryId } });
  console.log(`  Ireland guide: ${ARTICLES.length} articles, ${CHECKLIST.length} checklist steps, ${SIMS.length} SIM operators`);
}
