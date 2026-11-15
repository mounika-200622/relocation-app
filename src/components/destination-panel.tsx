import Link from "next/link";
import { ArrowRight, Banknote, BookOpen, Bus, Car, GraduationCap, Building2, Home, Landmark, MapPin, Phone, Pill, ShoppingBasket, Smartphone, Utensils, Wallet } from "lucide-react";
import type { DestinationBriefing } from "@/lib/destination";
import { formatMoney, formatRange } from "@/lib/format";
import { CurrencyConverter } from "@/components/currency-converter";
import { ListingCard } from "@/components/listing-card";
import { PhotoCredit } from "@/components/photo-credit";

const AUDIENCE: Record<string, string> = { STUDENT: "Students", YOUTH: "Under 26", TOURIST: "Visitors", SENIOR: "Seniors" };

/**
 * "Your destination": everything about the city on the person's profile – money, SIM cards,
 * transport and ride apps, first steps, banks, essentials and the homes nearest their campus.
 */
export function DestinationPanel({ d, checklist }: { d: DestinationBriefing; checklist: { done: number; total: number } }) {
  const b = d.briefing;
  const iso = b.country.isoCode.toLowerCase();
  const near = `lat=${b.position.lat}&lng=${b.position.lng}&cityId=${b.city.id}&label=${encodeURIComponent(d.campus ? d.campus.name : b.city.name)}`;
  const taxis = b.rides.filter((r) => r.kind === "RIDE_HAILING" || r.kind === "TAXI");
  const bikes = b.rides.filter((r) => r.kind === "BIKE_SHARE" || r.kind === "SCOOTER");
  const sameCurrency = b.home ? b.home.currency === b.country.currency : false;
  const costs = [
    b.costs.rentSharedRoom && ["Room in a shared home", `${formatRange(b.costs.rentSharedRoom.min, b.costs.rentSharedRoom.max, b.costs.rentSharedRoom.currency)} / month`],
    b.costs.groceriesMonth && ["Groceries", `${formatRange(b.costs.groceriesMonth.min, b.costs.groceriesMonth.max, b.costs.groceriesMonth.currency)} / month`],
    b.costs.transportMonth && ["Public transport", `${formatRange(b.costs.transportMonth.min, b.costs.transportMonth.max, b.costs.transportMonth.currency)} / month`],
    b.costs.cheapMeal && b.costs.cheapMeal.currency === b.country.currency && ["Cheap meal out", `${formatRange(b.costs.cheapMeal.min, b.costs.cheapMeal.max, b.costs.cheapMeal.currency)}`],
  ].filter((x): x is [string, string] => Boolean(x));

  return (
    <section aria-label={`About ${b.city.name}`} className="overflow-hidden rounded-3xl border border-line bg-elev">
      {/* header */}
      <div className="relative overflow-hidden p-6 md:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {b.photo && <img src={b.photo.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-elev)] via-[var(--bg-elev)]/80 to-transparent" />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent"><MapPin className="h-3.5 w-3.5" /> Your destination</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">
            {b.country.flag} {b.city.name}, <span className="font-display italic">{b.country.name}</span>
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {d.organization && (
              <span className="inline-flex items-center gap-1.5">
                {d.occupation === "STUDENT" ? <GraduationCap className="h-4 w-4 text-accent" /> : <Building2 className="h-4 w-4 text-accent" />}
                {d.organization}
              </span>
            )}
            <span>Currency {b.country.currency}</span>
            {b.city.region && <span>{b.city.region}</span>}
          </p>
          {d.organization && !d.campus && (
            <p className="mt-1 text-xs text-subtle">We couldn&apos;t find {d.organization} on the map, so distances are measured from the centre of {b.city.name}.</p>
          )}
          {b.emergency.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {b.emergency.map((e) => (
                <a key={`${e.service}-${e.number}`} href={`tel:${e.number}`} className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger">
                  <Phone className="h-3 w-3" /> {e.number} <span className="opacity-75">{e.service}</span>
                </a>
              ))}
            </div>
          )}
          {b.photo && <PhotoCredit credit={b.photo.credit} className="mt-3 block" />}
        </div>
      </div>

      {/* money */}
      <Block icon={<Wallet />} title={`Money in ${b.country.name}`} href={`/guide/${iso}#money`} cta="Banking guide">
        <div className="grid gap-4 lg:grid-cols-2">
          {b.home && !sameCurrency ? (
            <CurrencyConverter home={b.home.currency} local={b.country.currency} />
          ) : (
            <div className="rounded-2xl border border-line bg-soft p-4 text-sm text-muted">
              {b.home ? (
                <>You already use {b.country.currency} at home – no conversion needed.</>
              ) : (
                <><Link href="/profile" className="font-medium text-accent hover:underline">Add your home country</Link> to see today&apos;s exchange rate into {b.country.currency}.</>
              )}
            </div>
          )}
          <div className="rounded-2xl border border-line p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Typical costs in {b.city.name}</h4>
            {costs.length ? (
              <dl className="mt-2 divide-y divide-line text-sm">
                {costs.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 py-2"><dt className="text-muted">{k}</dt><dd className="font-medium tabular-nums">{v}</dd></div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted">No local price data yet – see the country guide.</p>
            )}
            {d.budget && b.costs.rentSharedRoom && d.budget.currency === b.costs.rentSharedRoom.currency && (
              <p className="mt-2 text-xs text-subtle">
                Your budget of {formatMoney(d.budget.amount, d.budget.currency)} {d.budget.amount >= b.costs.rentSharedRoom.min ? "covers a room in a shared home" : "is below the usual price of a shared room – consider sharing or looking further out"}.
              </p>
            )}
          </div>
        </div>
        {b.banks.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Landmark className="h-4 w-4 text-accent" /> Banks:
            {b.banks.map((k) => (
              <span key={k.name} className="rounded-lg border border-line px-2.5 py-1 text-xs text-fg">{k.name}{k.studentAccount ? " · student account" : ""}</span>
            ))}
          </p>
        )}
        <Link href={`/essentials?group=money&${near}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          <Banknote className="h-4 w-4" /> Currency exchange, banks and ATMs near {d.anchorLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Block>

      {/* SIM */}
      <Block icon={<Smartphone />} title="SIM cards" href={`/guide/${iso}#sim`} cta="Compare all plans">
        {b.sims.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {b.sims.map((s) => (
              <li key={s.name} className="rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{s.name}</span>
                  {s.isMvno && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">Budget</span>}
                </div>
                {s.cheapest ? (
                  <p className="mt-1 text-sm"><span className="font-semibold tabular-nums">{formatMoney(s.cheapest.price, s.cheapest.currency, { decimals: 2 })}</span><span className="text-muted"> · {s.cheapest.name}</span></p>
                ) : (
                  <p className="mt-1 text-sm text-muted">Prepaid and contract plans</p>
                )}
                {s.whereToBuy && <p className="mt-1 text-xs text-subtle">{s.whereToBuy}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No operators listed for {b.country.name} yet.</p>
        )}
      </Block>

      {/* transport */}
      <Block icon={<Bus />} title="Getting around" href={`/guide/${iso}#transport`} cta="Transport guide">
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="space-y-3">
            {b.transport.map((m) => (
              <li key={m.mode} className="text-sm">
                <span className="font-medium">{m.title}</span>
                {m.priceRange && <span className="block text-muted">{m.priceRange}</span>}
                {m.howToBuy && <span className="block text-xs text-subtle">{m.howToBuy}</span>}
              </li>
            ))}
            {!b.transport.length && <li className="text-sm text-muted">Public transport details are in the guide.</li>}
          </ul>
          <div className="space-y-4">
            {b.passes.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Cards and passes</h4>
                <ul className="mt-2 space-y-2">
                  {b.passes.map((p) => (
                    <li key={p.name} className="flex items-start justify-between gap-3 text-sm">
                      <span>
                        {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">{p.name}</a> : <span className="font-medium">{p.name}</span>}
                        {AUDIENCE[p.audience] && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">{AUDIENCE[p.audience]}</span>}
                        <span className="block text-xs text-subtle">{p.validity}</span>
                      </span>
                      {p.price !== null && <span className="shrink-0 font-medium tabular-nums">{formatMoney(p.price, p.currency, { decimals: p.price % 1 ? 2 : 0 })}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><Car className="h-3.5 w-3.5" /> Taxis and ride apps</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {taxis.map((r) =>
                  r.website ? (
                    <a key={r.name} href={r.website} target="_blank" rel="noreferrer" title={r.notes ?? undefined} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-soft">{r.name}</a>
                  ) : (
                    <span key={r.name} title={r.notes ?? undefined} className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted">{r.name}</span>
                  ),
                )}
                {bikes.map((r) => (
                  <a key={r.name} href={r.website ?? `/guide/${iso}#transport`} target={r.website ? "_blank" : undefined} rel="noreferrer" className="rounded-lg border border-dashed border-line px-3 py-1.5 text-xs text-muted hover:bg-soft">{r.name} · bikes</a>
                ))}
                {!taxis.length && !bikes.length && <span className="text-sm text-muted">No ride apps listed yet.</span>}
              </div>
              {taxis[0]?.notes && <p className="mt-2 text-xs text-subtle">{taxis[0].notes}</p>}
            </div>
          </div>
        </div>
      </Block>

      {/* first steps + essentials */}
      <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        <Tile href={`/guide/${iso}#checklist`} icon={<BookOpen />} title="Your first-week checklist" text={checklist.total ? `${checklist.done} of ${checklist.total} steps done · ${b.guide.articles} guide articles` : `Basics and emergency numbers for ${b.country.name}`} />
        <Tile href={`/essentials?group=food&${near}`} icon={<Utensils />} title={`Food near ${d.anchorLabel}`} text="Restaurants, cafés and takeaways with price estimates" />
        <Tile href={`/essentials?group=groceries&${near}`} icon={<ShoppingBasket />} title="Supermarkets" text="Groceries and convenience shops on a live map" />
        <Tile href={`/essentials?group=health&${near}`} icon={<Pill />} title="Pharmacies and doctors" text="Pharmacies, clinics and hospitals nearby" />
        <Tile href={`/essentials?group=transit&${near}`} icon={<Bus />} title="Stops and stations" text={`Bus, tram and train stops around ${d.anchorLabel}`} />
        <Tile href={`/essentials?group=phone&${near}`} icon={<Smartphone />} title="Phone shops" text="Where to buy a SIM card nearby" />
      </div>

      {/* homes */}
      <div className="border-t border-line p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Home className="h-5 w-5 text-accent" /> Places to live nearest {d.anchorLabel}</h3>
            <p className="mt-1 text-sm text-muted">{d.homes.length ? `Sorted by distance from ${d.campus ? d.campus.name : `the centre of ${b.city.name}`}.` : `No homes listed near ${b.city.name} yet.`}</p>
          </div>
          <Link href={`/relocate?all=1&lat=${b.position.lat}&lng=${b.position.lng}&sort=nearest`} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">See all on the map <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {d.homes.length > 0 && (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {d.homes.map((l) => <ListingCard key={l.id} l={l} budget={d.budget} showSave={false} distanceFrom={d.anchorLabel} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function Block({ icon, title, href, cta, children }: { icon: React.ReactNode; title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><span className="text-accent [&>svg]:h-5 [&>svg]:w-5">{icon}</span>{title}</h3>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm text-muted hover:text-fg">{cta} <ArrowRight className="h-4 w-4" /></Link>
      </div>
      {children}
    </div>
  );
}

function Tile({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="group bg-elev p-5 transition hover:bg-soft">
      <div className="flex items-center gap-2 font-semibold"><span className="text-accent [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{title}<ArrowRight className="ml-auto h-4 w-4 shrink-0 text-subtle transition group-hover:translate-x-0.5" /></div>
      <p className="mt-1.5 text-sm text-muted">{text}</p>
    </Link>
  );
}
