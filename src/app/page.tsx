import Link from "next/link";
import { Prisma } from "@prisma/client";
import { ArrowRight, BookOpen, Compass, HeartHandshake, MapPin, MessageCircle, Plane, Search, Sparkles, Train, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { homeFor } from "@/lib/authz";
import { HeroSearch } from "@/components/landing/hero-search";
import { ProductCollage } from "@/components/landing/product-collage";
import { LinkButton } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { WhereAmI } from "@/components/where-am-i";
import { PhotoCredit } from "@/components/photo-credit";

export const dynamic = "force-dynamic";

type Destination = { id: number; name: string; country: string; flag: string | null; listings: bigint; minPrice: Prisma.Decimal; currency: string; cover: string | null; photo: string | null; credit: string | null };

async function getData() {
  // GROUP BY + HAVING: cities that actually have active listings, with their cheapest price
  const destinations = await prisma.$queryRaw<Destination[]>`
    SELECT c.id, c.name, co.name AS country, co.flag, c.photoUrl AS photo, c.photoCredit AS credit, COUNT(l.id) AS listings, MIN(l.price) AS minPrice, MIN(l.currency) AS currency,
           (SELECT p.url FROM ListingPhoto p JOIN Listing l2 ON l2.id = p.listingId WHERE l2.cityId = c.id ORDER BY p.position LIMIT 1) AS cover
    FROM City c
    JOIN Country co ON co.id = c.countryId
    JOIN Listing l ON l.cityId = c.id AND l.status = 'ACTIVE'
    GROUP BY c.id, c.name, co.name, co.flag, c.photoUrl, c.photoCredit
    HAVING COUNT(l.id) >= 1
    ORDER BY listings DESC, c.name
    LIMIT 8`.catch(() => []);
  const [listings, cities, countries, seekers] = await Promise.all([
    prisma.listing.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    prisma.city.count().catch(() => 0),
    prisma.country.count().catch(() => 0),
    prisma.roommateRequest.count({ where: { status: "OPEN" } }).catch(() => 0),
  ]);
  return { destinations, stats: { listings, cities, countries, seekers } };
}

export default async function Home() {
  const [session, { destinations, stats }] = await Promise.all([auth(), getData()]);
  const role = session?.user?.role;

  return (
    <div className="relative overflow-x-clip">
      {/* ───────── hero ───────── */}
      <section className="relative">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--hero-glow)" }} />
        <div className="grid-bg absolute inset-0 -z-10 opacity-60" />
        <div className="mx-auto max-w-7xl px-4 pt-14 text-center md:px-6 md:pt-24">
          <Link href="/guide/ch" className="inline-flex items-center gap-2 rounded-full border border-line bg-elev/70 px-3.5 py-1.5 text-[13px] text-muted backdrop-blur hover:text-fg animate-fade-up">
            <Sparkles className="h-3.5 w-3.5 text-warm" /> New: the complete Switzerland settling-in guide <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <h1 className="mx-auto mt-7 max-w-4xl text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl md:text-[5.2rem] animate-fade-up">
            Wherever you&apos;re headed, <span className="font-display italic font-semibold text-gradient pr-2">settle in</span> faster.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-muted animate-fade-up [animation-delay:80ms]">
            Nira finds you a place and the right people to share it with, shows the pharmacy and tram stop around the corner, walks you through your first week —
            and plans trips that never go over budget.
          </p>
          <HeroSearch />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-subtle">
            <span>{stats.countries} countries</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span>{stats.cities.toLocaleString("en")} cities</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span>{stats.listings} places to live</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span>{stats.seekers} people looking for roommates</span>
          </div>
        </div>
        <ProductCollage />
      </section>

      {/* ───────── where am I ───────── */}
      <section className="mx-auto mt-16 max-w-7xl px-4 md:px-6">
        <WhereAmI />
      </section>

      {/* ───────── two journeys ───────── */}
      <section className="mx-auto mt-24 max-w-7xl px-4 md:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          <JourneyCard
            href={role ? homeFor(role) === "/choose-path" ? "/relocate/home" : homeFor(role) : "/signup"}
            icon={<Compass className="h-5 w-5" />}
            eyebrow="Moving to a new country"
            title="Find a home, find your people."
            points={["Search rooms, dorms and flats with real filters", "Roommate matches scored on budget, dates and lifestyle", "A first-week checklist for your exact city"]}
            tone="from-pink-500/30 via-fuchsia-500/10"
          />
          <JourneyCard
            href={role === "USER" ? "/trip/new" : "/signup"}
            icon={<Plane className="h-5 w-5" />}
            eyebrow="Planning a trip"
            title="A day-by-day plan that fits your budget."
            points={["Where to stay, eat and go — from live map data", "Budget split you control, never exceeded", "Swap any stop, share a read-only link"]}
            tone="from-amber-500/20 via-amber-500/5"
          />
        </div>
      </section>

      {/* ───────── bento ───────── */}
      <section className="mx-auto mt-28 max-w-7xl px-4 md:px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Everything for the first 90 days</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Built for the boring, important parts of moving.</h2>
        </div>
        <div className="mt-10 grid auto-rows-[minmax(190px,auto)] gap-4 md:grid-cols-6">
          <Bento className="md:col-span-4 md:row-span-2" icon={<Search />} title="Search that respects your budget" text="Filter by city, price, type, open spots, amenities and move-in date. Your monthly budget is pre-filled and every result tells you whether it fits.">
            <div className="mt-6 grid grid-cols-3 gap-3">
              {destinations.slice(0, 3).map((d) => (
                <div key={d.id} className="overflow-hidden rounded-2xl border border-line bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {(d.photo ?? d.cover) && <img src={(d.photo ?? d.cover)!} alt={d.name} className="aspect-[4/3] w-full object-cover" />}
                  <div className="p-2.5 text-xs"><div className="font-semibold">{d.name}</div><div className="text-subtle">from {formatMoney(Number(d.minPrice), d.currency)}</div></div>
                </div>
              ))}
            </div>
          </Bento>
          <Bento className="md:col-span-2" icon={<HeartHandshake />} title="Roommate matching" text="A 0–100 score from budget overlap, move-in dates, gender preferences and lifestyle — computed in SQL." />
          <Bento className="md:col-span-2" icon={<MapPin />} title="Nearby essentials" text="Supermarkets, pharmacies, hospitals, SIM shops and tram stops within walking distance of any place." />
          <Bento className="md:col-span-2" icon={<BookOpen />} title="A guide from the very basics" text="Register, insure, bank, SIM, transport passes — in order, with a checklist that remembers your progress." />
          <Bento className="md:col-span-2" icon={<Train />} title="Live Swiss connections" text="Departures, durations and transfers straight from the Swiss timetable." />
          <Bento className="md:col-span-2" icon={<Wallet />} title="Trips that fit the budget" text="Stay, food, sights and transport allocated by a budget ledger that never overspends." />
          <Bento className="md:col-span-6 lg:col-span-6" icon={<MessageCircle />} title="Talk safely, inside Nira" text="Message owners and future flatmates without sharing your phone or email. Block or report anyone in one tap." horizontal />
        </div>
      </section>

      {/* ───────── destinations ───────── */}
      {destinations.length > 0 && (
        <section className="mx-auto mt-28 max-w-7xl px-4 md:px-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">Popular destinations</h2>
            <Link href="/relocate" className="hidden text-sm text-muted hover:text-fg sm:inline-flex items-center gap-1">Browse all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {destinations.map((d) => (
              <Link key={d.id} href={`/relocate?cityId=${d.id}&city=${encodeURIComponent(`${d.name}, ${d.country}`)}`} className="group relative w-[70vw] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-[45vw] md:w-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {(d.photo ?? d.cover) && <img src={(d.photo ?? d.cover)!} alt={d.name} className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="text-xs opacity-80">{d.flag} {d.country}</div>
                  <div className="text-2xl font-semibold">{d.name}</div>
                  <div className="mt-1 text-sm opacity-85">{Number(d.listings)} places · from {formatMoney(Number(d.minPrice), d.currency)}</div>
                  {d.photo && <PhotoCredit credit={d.credit} light className="mt-2 block truncate" />}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───────── how it works ───────── */}
      <section className="mx-auto mt-28 max-w-7xl px-4 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">Three steps to settled</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Tell us where and when", "Pick your destination, budget, move-in date and how you like to live."],
            ["Match a place and people", "Shortlist places, see who wants to share them and chat inside Nira."],
            ["Arrive prepared", "Follow your city's checklist and find everything you need nearby."],
          ].map(([t, d], i) => (
            <li key={t} className="card p-6">
              <span className="font-display text-5xl italic text-accent">{i + 1}</span>
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="mx-auto mt-28 max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-elev px-6 py-16 text-center md:px-16">
          <div className="absolute inset-0" style={{ background: "radial-gradient(50% 80% at 50% 120%, rgb(236 72 153 / 0.4), transparent)" }} />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
            Your new city is waiting. <span className="font-display italic text-accent">Let&apos;s go.</span>
          </h2>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href={session ? homeFor(role) : "/signup"} size="lg">{session ? "Open Nira" : "Create a free account"} <ArrowRight className="h-4 w-4" /></LinkButton>
            <LinkButton href="/signup?role=BUSINESS" size="lg" variant="secondary">I rent out places</LinkButton>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function JourneyCard({ href, icon, eyebrow, title, points, tone }: { href: string; icon: React.ReactNode; eyebrow: string; title: string; points: string[]; tone: string }) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-[1.75rem] border border-line bg-elev p-7 transition hover:border-line-strong md:p-9">
      <div className={`absolute inset-0 bg-gradient-to-br ${tone} to-transparent opacity-80`} />
      <div className="relative">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-soft text-fg">{icon}</span>
        <div className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</div>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h3>
        <ul className="mt-5 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[15px] text-muted"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{p}</li>
          ))}
        </ul>
        <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold">Get started <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

function Bento({ icon, title, text, className, children, horizontal }: { icon: React.ReactNode; title: string; text: string; className?: string; children?: React.ReactNode; horizontal?: boolean }) {
  return (
    <div className={`card relative overflow-hidden p-6 md:p-7 ${horizontal ? "md:flex md:items-center md:gap-6" : ""} ${className ?? ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <div className={horizontal ? "mt-4 md:mt-0" : "mt-5"}>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      </div>
      {children}
    </div>
  );
}
