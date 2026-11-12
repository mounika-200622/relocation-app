import type { GuideCategory, PrismaClient } from "@prisma/client";
import { findCity } from "./locations";

/**
 * Settling-in content for India with Bengaluru-specific transport. Prices are indicative
 * (2025/26) and change often – every article carries a source.
 */
type Article = { slug: string; category: GuideCategory; title: string; summary: string; body: string; sourceName: string; sourceUrl: string };

const ARTICLES: Article[] = [
  {
    slug: "first-week",
    category: "BASICS",
    title: "Your first week in India",
    summary: "Registration for long stays, a SIM card, money, getting around and a place to live.",
    sourceName: "Bureau of Immigration, Government of India",
    sourceUrl: "https://indianfrro.gov.in/eservices/",
    body: `## 1. Register if you need to (e-FRRO)
Foreigners on a visa of more than 180 days (student, employment, research and some others) must register with the Foreigners Regional Registration Office within **14 days** of arrival. It is done online through **e-FRRO**; keep your passport, visa, photo, address proof and the letter from your university or employer ready.

## 2. Get a SIM card
You need your passport, visa and a passport photo, plus a local address. Operators verify you in store, and the SIM usually activates within a day. See *SIM cards* below.

## 3. Money
Carry some cash for autos and small shops, but India runs on **UPI** (QR payments). Foreign visitors can use **UPI One World** wallets sold at some airports until they have an Indian bank account.

## 4. Get around
In Bengaluru combine **Namma Metro** for long distances with autos or ride apps (Uber, Ola, Rapido, Namma Yatri) for the last kilometres. BMTC buses are the cheapest option.

## 5. Find a place
Rental agreements are usually 11 months. Deposits in Bengaluru are high (often several months' rent). Use verified listings and never pay a deposit before visiting.`,
  },
  {
    slug: "sim-cards",
    category: "SIM",
    title: "SIM cards and mobile data in India",
    summary: "Jio, Airtel, Vi and BSNL – prepaid packs, what to bring and eSIM.",
    sourceName: "Department of Telecommunications",
    sourceUrl: "https://dot.gov.in/",
    body: `India has four operators: **Jio**, **Airtel**, **Vi (Vodafone Idea)** and the state-owned **BSNL**. Data is very cheap; most people use prepaid packs that renew every 28 days.

## What to bring
- Passport and visa (originals + copies)
- One passport photo
- A local address and, often, a local reference phone number

## Tips
- Airtel and Jio have the widest 4G/5G coverage in Bengaluru.
- Buy at an official operator store (airports have counters) rather than a street kiosk.
- eSIM is available on Jio and Airtel once you have a physical connection activated.
- Recharge online through the operator app or any UPI app.`,
  },
  {
    slug: "getting-around-bengaluru",
    category: "TRANSPORT",
    title: "Getting around Bengaluru",
    summary: "Namma Metro, BMTC buses, autos and ride apps – and the airport bus.",
    sourceName: "Bangalore Metro Rail Corporation",
    sourceUrl: "https://english.bmrc.co.in/",
    body: `## Namma Metro
The fastest way across the city during rush hour. The **Purple line** runs east–west (Whitefield – Challaghatta), the **Green line** north–south, and the **Yellow line** serves Electronic City. Buy a **smart card** or a QR ticket in the *Namma Metro* app; tap in and out.

## BMTC buses
Cheap and everywhere. Pay the conductor in cash or by UPI, or buy a day pass. Women ride free on non-AC city buses under the Shakti scheme. **Vayu Vajra** AC buses connect the airport with the city.

## Autos
Three-wheelers for short trips. Ask for the meter or book through **Namma Yatri** (driver-owned app), Uber or Ola to avoid haggling.

## Cabs and bike taxis
**Uber** and **Ola** for cars; **Rapido** for bike taxis, often the quickest way through traffic.

## Tips
Traffic peaks 8–11 and 17–21. Keep Google Maps or the BMTC app for live bus times, and always carry some small cash.`,
  },
  {
    slug: "healthcare",
    category: "HEALTHCARE",
    title: "Healthcare in India",
    summary: "Private hospitals, insurance, pharmacies and emergency numbers.",
    sourceName: "Ministry of Health and Family Welfare",
    sourceUrl: "https://www.mohfw.gov.in/",
    body: `Most expats use **private hospitals and clinics**, which are good and fast but paid out of pocket or through insurance. Get **health insurance** that covers India before you arrive or through your employer/university.

## Emergencies
- **112** – national emergency number
- **108** – ambulance in most states
- **100** – police

## Pharmacies
Pharmacies (*chemists*) are everywhere and many are open late. Large chains include Apollo Pharmacy and MedPlus; apps deliver within hours. Many medicines need a prescription.

Use the *Nearby essentials* map to see hospitals, clinics and pharmacies around your home.`,
  },
  {
    slug: "money-and-banking",
    category: "MONEY",
    title: "Money, banks and UPI",
    summary: "Opening an account as a foreigner, UPI payments, ATMs and exchanging money.",
    sourceName: "Reserve Bank of India",
    sourceUrl: "https://www.rbi.org.in/",
    body: `The currency is the **Indian rupee (INR, ₹)**.

## Bank account
Foreign nationals living in India can open a resident account with passport, visa, FRRO registration (if required), address proof and a photo. SBI, HDFC Bank, ICICI Bank and Axis Bank all serve foreigners; employers often arrange it.

## UPI
Once you have a bank account and an Indian mobile number, link them to a UPI app (Google Pay, PhonePe, Paytm) and pay anywhere by scanning QR codes.

## Exchanging money
Use banks or authorised money changers and keep the receipt. Avoid street exchangers. ATMs are widespread; foreign cards may be charged a fee.

## Tipping
Not compulsory; 5–10 % in restaurants is common if no service charge is added.`,
  },
  {
    slug: "groceries-and-daily-life",
    category: "GROCERIES",
    title: "Groceries and daily life",
    summary: "Supermarkets, 10-minute delivery apps, water and waste.",
    sourceName: "Nira editorial",
    sourceUrl: "https://www.bbmp.gov.in/",
    body: `## Where to shop
Supermarkets such as DMart, More and Reliance Smart, neighbourhood *kirana* stores for daily needs, and quick-commerce apps (Blinkit, Zepto, Swiggy Instamart, BigBasket) that deliver in minutes.

## Drinking water
Don't drink tap water; use filtered water (RO purifiers are common in flats) or sealed bottles.

## Waste
Bengaluru asks households to separate **wet, dry and sanitary** waste for the daily collection.

## Power
230 V, plug types C, D and M. Short power cuts happen; many buildings have backup.`,
  },
  {
    slug: "renting-a-home",
    category: "HOUSING",
    title: "Renting in Bengaluru",
    summary: "Agreements, deposits, brokers, PGs and how to avoid scams.",
    sourceName: "Nira editorial",
    sourceUrl: "https://igr.karnataka.gov.in/",
    body: `## Types of homes
Flats (1/2/3 BHK), shared flats, and **PGs** (paying guest accommodation) with meals – popular with students and new arrivals.

## Agreement and deposit
Rental agreements are usually **11 months**. Deposits in Bengaluru are often **several months' rent**; negotiate and get every payment receipted. Brokers typically charge one month's rent.

## Before you sign
- Visit in person and check water supply, power backup and parking.
- Read the notice period and maintenance charges.
- Never pay a "token" before seeing the place; keep all contact inside Nira until you meet.`,
  },
];

const CHECKLIST: { title: string; description: string; category: GuideCategory; dueWithinDays?: number; link?: string }[] = [
  { title: "Register on e-FRRO (long-stay visas)", description: "Required within 14 days for visas over 180 days. Online at indianfrro.gov.in.", category: "LEGAL", dueWithinDays: 14, link: "https://indianfrro.gov.in/eservices/" },
  { title: "Get an Indian SIM card", description: "Passport, visa and a photo at an operator store.", category: "SIM", dueWithinDays: 2 },
  { title: "Set up a way to pay", description: "Cash for autos, a UPI One World wallet or an Indian bank account + UPI.", category: "MONEY", dueWithinDays: 3 },
  { title: "Buy health insurance", description: "Private care is paid out of pocket without it.", category: "HEALTHCARE", dueWithinDays: 7 },
  { title: "Get a Namma Metro smart card", description: "Faster entry and a small discount on every ride.", category: "TRANSPORT", dueWithinDays: 7, link: "https://english.bmrc.co.in/" },
  { title: "Install ride and delivery apps", description: "Uber/Ola/Rapido/Namma Yatri for rides, and a grocery app.", category: "TRANSPORT", dueWithinDays: 2 },
  { title: "Open a bank account", description: "Bring passport, visa, FRRO registration and address proof.", category: "MONEY", dueWithinDays: 30 },
  { title: "Sign an 11-month rental agreement", description: "Get every deposit payment receipted.", category: "HOUSING", dueWithinDays: 30 },
];

const SIMS = [
  { name: "Jio", isMvno: false, website: "https://www.jio.com/", whereToBuy: "Jio stores, Reliance Digital, airport counters", documentsNeeded: "Passport, visa, passport photo, local address", touristTip: "Ask for a tourist SIM at the airport counter.", plans: [{ name: "Prepaid 28 days · 2 GB/day", kind: "PREPAID" as const, priceMonthly: 349, dataGb: 56 }] },
  { name: "Airtel", isMvno: false, website: "https://www.airtel.in/", whereToBuy: "Airtel stores, airport counters", documentsNeeded: "Passport, visa, passport photo, local address", studentTip: "Strong coverage across Bengaluru.", plans: [{ name: "Prepaid 28 days · 2 GB/day", kind: "PREPAID" as const, priceMonthly: 379, dataGb: 56 }] },
  { name: "Vi (Vodafone Idea)", isMvno: false, website: "https://www.myvi.in/", whereToBuy: "Vi stores", documentsNeeded: "Passport, visa, passport photo, local address", plans: [{ name: "Prepaid 28 days · 1.5 GB/day", kind: "PREPAID" as const, priceMonthly: 349, dataGb: 42 }] },
  { name: "BSNL", isMvno: false, website: "https://www.bsnl.co.in/", whereToBuy: "BSNL customer service centres", documentsNeeded: "Passport, visa, passport photo, local address", plans: [{ name: "Prepaid 30 days · 2 GB/day", kind: "PREPAID" as const, priceMonthly: 229, dataGb: 60 }] },
];

const MODES = [
  { mode: "METRO" as const, title: "Metro (Namma Metro in Bengaluru)", description: "Fast, air-conditioned and reliable in rush hour. Bengaluru's Purple, Green and Yellow lines; Delhi, Mumbai, Chennai and other cities have their own.", howToBuy: "Smart card at stations, or QR tickets in the Namma Metro app.", apps: "Namma Metro, Google Maps", priceRange: "₹10–90 per trip" },
  { mode: "BUS" as const, title: "City buses (BMTC in Bengaluru)", description: "The cheapest way around; AC Vajra and Vayu Vajra (airport) buses plus ordinary buses. Women travel free on non-AC buses in Karnataka.", howToBuy: "Pay the conductor in cash or UPI, or buy a daily pass.", apps: "BMTC Namma BMTC, Google Maps", priceRange: "₹5–35 per ride; airport bus ~₹250–330" },
  { mode: "TRAIN" as const, title: "Indian Railways", description: "Long-distance trains between cities; book early for sleeper and AC classes.", howToBuy: "IRCTC website/app or station counters.", apps: "IRCTC Rail Connect", priceRange: "From a few hundred rupees" },
  { mode: "WALK" as const, title: "Walking", description: "Pavements can be uneven or blocked; cross at signals and watch for two-wheelers.", priceRange: "Free" },
];

const PASSES = [
  { name: "Namma Metro smart card", description: "Rechargeable card for the Bengaluru metro with a small fare discount.", price: 50, validity: "Card deposit, top up as needed", audience: "EVERYONE" as const, url: "https://english.bmrc.co.in/", city: "Bengaluru" },
  { name: "BMTC daily pass (non-AC)", description: "Unlimited rides on ordinary BMTC buses for a day.", price: 80, validity: "1 day", audience: "EVERYONE" as const, city: "Bengaluru" },
  { name: "Vayu Vajra airport bus", description: "AC bus between Kempegowda Airport and the city.", price: 300, validity: "Single trip", audience: "EVERYONE" as const, city: "Bengaluru" },
];

const MARKETS = [
  { name: "DMart", priceTier: 1, notes: "Big-box discount supermarket." },
  { name: "More", priceTier: 2, notes: "Neighbourhood supermarkets." },
  { name: "Reliance Smart", priceTier: 2, notes: "Supermarkets across the city." },
  { name: "Nature's Basket", priceTier: 4, notes: "Premium and imported foods." },
];

const BANKS = [
  { name: "State Bank of India", kind: "Public bank", studentAccount: true, notes: "Largest bank; branches everywhere." },
  { name: "HDFC Bank", kind: "Private bank", studentAccount: true, notes: "Good app and many ATMs." },
  { name: "ICICI Bank", kind: "Private bank", studentAccount: true, notes: "Often used by employers for salary accounts." },
  { name: "Axis Bank", kind: "Private bank", studentAccount: false, notes: "Wide network in Bengaluru." },
];

export async function seedIndiaGuide(prisma: PrismaClient) {
  const country = await prisma.country.findUnique({ where: { isoCode: "IN" }, select: { id: true } });
  if (!country) return;
  const countryId = country.id;
  const blr = await findCity(prisma, "IN", "Bengaluru").catch(() => null);

  for (const [i, a] of ARTICLES.entries()) {
    await prisma.guideArticle.upsert({ where: { countryId_slug: { countryId, slug: a.slug } }, update: { ...a, position: i, cityId: a.slug.includes("bengaluru") ? blr?.id ?? null : null }, create: { ...a, countryId, position: i, cityId: a.slug.includes("bengaluru") ? blr?.id ?? null : null } });
  }
  for (const [i, c] of CHECKLIST.entries()) {
    await prisma.checklistTemplate.upsert({ where: { countryId_title: { countryId, title: c.title } }, update: { ...c, position: i }, create: { ...c, countryId, position: i } });
  }
  for (const s of SIMS) {
    const { plans, ...p } = s;
    const row = await prisma.simProvider.upsert({ where: { countryId_name: { countryId, name: s.name } }, update: p, create: { ...p, countryId } });
    for (const plan of plans) {
      await prisma.simPlan.upsert({ where: { providerId_name: { providerId: row.id, name: plan.name } }, update: { ...plan, currency: "INR", notes: "Indicative price, changes often" }, create: { ...plan, currency: "INR", notes: "Indicative price, changes often", providerId: row.id } });
    }
  }
  for (const [i, m] of MODES.entries()) {
    await prisma.transportMode.upsert({ where: { countryId_mode: { countryId, mode: m.mode } }, update: { ...m, position: i }, create: { ...m, countryId, position: i } });
  }
  for (const p of PASSES) {
    const { city, ...pass } = p;
    const cityId = city === "Bengaluru" ? blr?.id ?? null : null;
    await prisma.transportPass.upsert({ where: { countryId_name: { countryId, name: p.name } }, update: { ...pass, cityId, currency: "INR" }, create: { ...pass, cityId, currency: "INR", countryId } });
  }
  for (const m of MARKETS) await prisma.supermarketChain.upsert({ where: { countryId_name: { countryId, name: m.name } }, update: m, create: { ...m, countryId } });
  for (const b of BANKS) await prisma.bank.upsert({ where: { countryId_name: { countryId, name: b.name } }, update: { ...b, currency: "INR" }, create: { ...b, currency: "INR", countryId } });
  console.log(`  India guide: ${ARTICLES.length} articles, ${CHECKLIST.length} checklist steps, ${SIMS.length} SIM operators`);
}
