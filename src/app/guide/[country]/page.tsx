import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Banknote, Bus, Cable, Footprints, HeartPulse, Phone, Ship, ShoppingCart, Siren, Smartphone, Train, TramFront, Bike } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { costSnapshot } from "@/lib/costs";
import { formatDate, formatMoney, formatRange, num, titleCase } from "@/lib/format";
import { Badge, SectionTitle } from "@/components/ui/misc";
import { Checklist } from "./checklist";
import { ConnectionSearch } from "./connections";
import { CurrencyConverter } from "@/components/currency-converter";
import { PhotoCredit } from "@/components/photo-credit";

type Props = { params: Promise<{ country: string }>; searchParams: Promise<{ city?: string }> };

async function getCountry(iso: string) {
  if (!/^[a-z]{2}$/i.test(iso)) return null;
  return prisma.country.findUnique({ where: { isoCode: iso.toUpperCase() }, select: { id: true, name: true, isoCode: true, flag: true, currency: true, photoUrl: true, photoCredit: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCountry((await params).country);
  return { title: c ? `Settling in ${c.name}` : "Guide" };
}

const MODE_ICON = { TRAIN: Train, TRAM: TramFront, BUS: Bus, METRO: Train, BOAT: Ship, CABLE_CAR: Cable, BIKE: Bike, WALK: Footprints } as const;
const COST_LABEL: Record<string, string> = {
  RENT_SHARED_ROOM: "Room in a shared flat", RENT_STUDIO: "Studio", RENT_ONE_BEDROOM: "1-bedroom flat", GROCERIES_MONTH: "Groceries (1 person)",
  TRANSPORT_MONTH: "Monthly transport pass", TRANSPORT_DAY: "Transport day pass", PHONE_MONTH: "Mobile plan", COFFEE: "Coffee", MEAL: "Meal out",
};

export default async function CountryGuide({ params, searchParams }: Props) {
  const country = await getCountry((await params).country);
  if (!country) notFound();
  const { city: cityParam } = await searchParams;
  const session = await auth();
  const profile = session?.user ? await prisma.userProfile.findUnique({ where: { userId: session.user.id }, select: { destinationCityId: true, destinationCity: { select: { countryId: true } }, homeCountry: { select: { currency: true, name: true } } } }) : null;
  const cityId = cityParam ? Number(cityParam) : profile?.destinationCity?.countryId === country.id ? profile.destinationCityId : null;

  const [articles, checklist, done, sims, modes, passes, emergency, markets, banks, costs, city, rides] = await Promise.all([
    prisma.guideArticle.findMany({ where: { countryId: country.id }, orderBy: [{ position: "asc" }], select: { slug: true, title: true, summary: true, category: true, updatedAt: true } }),
    prisma.checklistTemplate.findMany({ where: { countryId: country.id }, orderBy: { position: "asc" } }),
    session?.user ? prisma.userChecklistProgress.findMany({ where: { userId: session.user.id, item: { countryId: country.id } }, select: { itemId: true } }) : [],
    prisma.simProvider.findMany({ where: { countryId: country.id }, orderBy: [{ isMvno: "asc" }, { name: "asc" }], include: { plans: { orderBy: { priceMonthly: "asc" } } } }),
    prisma.transportMode.findMany({ where: { countryId: country.id }, orderBy: { position: "asc" } }),
    prisma.transportPass.findMany({ where: { countryId: country.id, OR: [{ cityId: null }, ...(cityId ? [{ cityId }] : [])] }, orderBy: [{ cityId: "desc" }, { price: "asc" }], include: { city: { select: { name: true } } } }),
    prisma.emergencyNumber.findMany({ where: { countryId: country.id } }),
    prisma.supermarketChain.findMany({ where: { countryId: country.id }, orderBy: { priceTier: "asc" } }),
    prisma.bank.findMany({ where: { countryId: country.id }, orderBy: { name: "asc" } }),
    costSnapshot(cityId, country.id),
    cityId ? prisma.city.findUnique({ where: { id: cityId }, select: { name: true, lat: true, lng: true } }) : null,
    prisma.rideService.findMany({ where: { countryId: country.id }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
  ]);
  const doneIds = new Set(done.map((d) => d.itemId));
  const lastUpdated = articles.reduce<Date | null>((m, a) => (!m || a.updatedAt > m ? a.updatedAt : m), null);
  const hasTransit = country.isoCode === "CH" || country.isoCode === "LI";
  const nav = [
    ["checklist", "First week", checklist.length], ["costs", "Costs", costs.length], ["sim", "SIM cards", sims.length], ["transport", "Transport", modes.length + passes.length + rides.length],
    ["health", "Healthcare", 1], ["money", "Money", banks.length], ["groceries", "Groceries", markets.length], ["articles", "All articles", articles.length],
  ].filter(([, , n]) => Number(n) > 0) as [string, string, number][];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-line bg-elev p-8 md:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {country.photoUrl && <img src={country.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        {country.photoUrl && <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-elev)] via-[var(--bg-elev)]/80 to-transparent" />}
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 90% at 100% 0%, rgb(236 72 153 / 0.28), transparent)" }} />
        <div className="relative">
          <Link href="/guide" className="text-sm text-muted hover:text-fg">← All countries</Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{country.flag} Settling in <span className="font-display italic">{country.name}</span></h1>
          <p className="mt-3 max-w-2xl text-muted">{articles.length ? "Everything for your first weeks, in the order you need it." : "We're still writing the full guide for this country — here's what we already have."}{city && <> Showing extras for <b className="text-fg">{city.name}</b>.</>}</p>
          {lastUpdated && <p className="mt-3 text-xs text-subtle">Last updated {formatDate(lastUpdated)} · prices are indicative</p>}
          <PhotoCredit credit={country.photoCredit} className="mt-2 block" />
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Guide sections" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:px-0">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-xl px-3 py-2 text-sm text-muted hover:bg-soft hover:text-fg">{label}</a>
          ))}
        </nav>

        <div className="min-w-0 space-y-16">
          {emergency.length > 0 && (
            <section className="rounded-3xl border border-danger/25 bg-danger/5 p-6">
              <div className="flex items-center gap-2 font-semibold text-danger"><Siren className="h-5 w-5" /> Emergency numbers</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {emergency.map((e) => (
                  <a key={e.id} href={`tel:${e.number}`} className="rounded-2xl bg-elev p-4 transition hover:-translate-y-0.5">
                    <div className="text-3xl font-bold tabular-nums text-danger">{e.number}</div>
                    <div className="mt-1 text-sm font-medium">{e.service}</div>
                    {e.notes && <div className="text-xs text-subtle">{e.notes}</div>}
                  </a>
                ))}
              </div>
            </section>
          )}

          {checklist.length > 0 && (
            <section id="checklist" className="scroll-mt-24">
              <SectionTitle>First-week checklist</SectionTitle>
              <Checklist items={checklist.map((c) => ({ id: c.id, title: c.title, description: c.description, category: c.category, dueWithinDays: c.dueWithinDays, link: c.link, done: doneIds.has(c.id) }))} loggedIn={Boolean(session?.user)} />
            </section>
          )}

          {costs.length > 0 && (
            <section id="costs" className="scroll-mt-24">
              <SectionTitle>Cost of living {city ? `in ${city.name}` : `in ${country.name}`}</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {costs.filter((c) => c.tier === 0 || (c.category === "MEAL" && c.tier <= 2)).map((c) => (
                  <div key={`${c.category}${c.tier}`} className="card p-5">
                    <div className="text-sm text-muted">{c.category === "MEAL" ? (c.tier === 1 ? "Cheap meal" : "Mid-range meal") : COST_LABEL[c.category] ?? titleCase(c.category)}</div>
                    <div className="mt-2 text-xl font-semibold tabular-nums">{formatRange(c.min, c.max, c.currency)}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-subtle">Source: {costs[0]?.source ?? "Nira estimates"}. Estimates, not quotes.</p>
            </section>
          )}

          {sims.length > 0 && (
            <section id="sim" className="scroll-mt-24">
              <SectionTitle>SIM cards & mobile plans</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                {sims.map((s) => (
                  <div key={s.id} className="card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold"><Smartphone className="h-4 w-4 text-accent" />{s.name}</div>
                      <Badge tone={s.isMvno ? "warm" : "accent"}>{s.isMvno ? `MVNO${s.network ? ` · ${s.network} network` : ""}` : "Network operator"}</Badge>
                    </div>
                    <ul className="mt-3 divide-y divide-line text-sm">
                      {s.plans.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                          <span><span className="font-medium">{p.name}</span> <span className="text-xs text-subtle">{p.kind.toLowerCase()} · {p.dataGb === null ? "unlimited data" : `${num(p.dataGb)} GB`}{p.euRoaming ? " · EU roaming" : ""}</span></span>
                          <span className="shrink-0 font-semibold tabular-nums">{formatMoney(num(p.priceMonthly), p.currency, { decimals: 2 })}</span>
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-3 space-y-1 text-xs text-muted">
                      <div><dt className="inline font-medium text-fg">Where to buy: </dt><dd className="inline">{s.whereToBuy}</dd></div>
                      <div><dt className="inline font-medium text-fg">Bring: </dt><dd className="inline">{s.documentsNeeded}</dd></div>
                      {s.studentTip && <div><dt className="inline font-medium text-fg">Students: </dt><dd className="inline">{s.studentTip}</dd></div>}
                      {s.touristTip && <div><dt className="inline font-medium text-fg">Tourists: </dt><dd className="inline">{s.touristTip}</dd></div>}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(modes.length > 0 || hasTransit || rides.length > 0) && (
            <section id="transport" className="scroll-mt-24 space-y-6">
              <SectionTitle>Getting around</SectionTitle>
              {hasTransit && <ConnectionSearch country={country.isoCode} defaultFrom={city?.name} />}
              <div className="grid gap-3 sm:grid-cols-2">
                {modes.map((m) => {
                  const Icon = MODE_ICON[m.mode];
                  return (
                    <div key={m.id} className="card p-5">
                      <div className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-accent" />{m.title}</div>
                      <p className="mt-2 text-sm text-muted">{m.description}</p>
                      <div className="mt-3 space-y-1 text-xs text-subtle">
                        {m.howToBuy && <p><b className="text-fg">Tickets:</b> {m.howToBuy}</p>}
                        {m.apps && <p><b className="text-fg">Apps:</b> {m.apps}</p>}
                        {m.priceRange && <p><b className="text-fg">Price:</b> {m.priceRange}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {rides.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">Taxis, ride-hailing & sharing</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rides.map((r) => (
                      <div key={r.id} className="card p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{r.name}</span>
                          <Badge>{titleCase(r.kind)}</Badge>
                        </div>
                        {r.notes && <p className="mt-1.5 text-sm text-muted">{r.notes}</p>}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {r.name === "Uber" && <a href="https://m.uber.com/ul/?action=setPickup&pickup=my_location" target="_blank" rel="noreferrer" className="rounded-lg bg-fg px-2.5 py-1 font-semibold text-bg">Open app</a>}
                          {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-2.5 py-1 hover:bg-soft">Website</a>}
                          {r.phone && <a href={`tel:${r.phone.replace(/s/g, "")}`} className="rounded-lg border border-line px-2.5 py-1 hover:bg-soft">Call {r.phone}</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {passes.length > 0 && (
                <div className="card overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle"><tr><th className="px-5 py-3 font-medium">Pass</th><th className="px-3 py-3 font-medium">For</th><th className="px-3 py-3 font-medium">Valid</th><th className="px-5 py-3 text-right font-medium">Price</th></tr></thead>
                    <tbody className="divide-y divide-line">
                      {passes.map((p) => (
                        <tr key={p.id}>
                          <td className="px-5 py-3"><div className="font-medium">{p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="hover:underline">{p.name}</a> : p.name}</div><div className="text-xs text-subtle">{p.description}</div></td>
                          <td className="px-3"><Badge>{p.city ? p.city.name : titleCase(p.audience)}</Badge></td>
                          <td className="px-3 text-muted">{p.validity}</td>
                          <td className="px-5 text-right font-semibold tabular-nums">{p.price ? formatMoney(num(p.price), p.currency, { decimals: num(p.price)! % 1 ? 2 : 0 }) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <section id="health" className="scroll-mt-24">
            <SectionTitle>Healthcare</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {articles.filter((a) => a.category === "HEALTHCARE").map((a) => <ArticleCard key={a.slug} iso={country.isoCode} a={a} />)}
              <Link href={city?.lat ? `/essentials?lat=${city.lat}&lng=${city.lng}&label=${encodeURIComponent(city.name)}` : "/essentials"} className="card flex items-center gap-4 p-5 hover:border-line-strong">
                <HeartPulse className="h-8 w-8 text-danger" />
                <span className="flex-1"><span className="block font-semibold">Hospitals & pharmacies near you</span><span className="text-sm text-muted">Live map of clinics, doctors and on-duty pharmacies.</span></span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {banks.length > 0 && (
            <section id="money" className="scroll-mt-24">
              <SectionTitle>Money & banking · {country.currency}</SectionTitle>
              {profile?.homeCountry && profile.homeCountry.currency !== country.currency && <CurrencyConverter home={profile.homeCountry.currency} local={country.currency} className="mb-4 max-w-xl" />}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {banks.map((b) => (
                  <div key={b.id} className="card p-5">
                    <div className="flex items-center gap-2 font-semibold"><Banknote className="h-4 w-4 text-success" />{b.name}</div>
                    <div className="mt-1 flex gap-2"><Badge>{b.kind}</Badge>{b.studentAccount && <Badge tone="success">Student account</Badge>}</div>
                    {b.notes && <p className="mt-2 text-sm text-muted">{b.notes}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">{articles.filter((a) => a.category === "MONEY").map((a) => <ArticleCard key={a.slug} iso={country.isoCode} a={a} />)}</div>
            </section>
          )}

          {markets.length > 0 && (
            <section id="groceries" className="scroll-mt-24">
              <SectionTitle>Groceries & daily life</SectionTitle>
              <div className="card divide-y divide-line">
                {markets.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                    <ShoppingCart className="h-4 w-4 text-subtle" />
                    <div className="flex-1"><div className="font-medium">{m.name}</div><div className="text-xs text-subtle">{m.notes}</div></div>
                    <span className="font-mono text-sm tracking-wider" aria-label={`Price level ${m.priceTier} of 4`}><span className="text-success">{"$".repeat(m.priceTier)}</span><span className="text-line-strong">{"$".repeat(4 - m.priceTier)}</span></span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">{articles.filter((a) => a.category === "GROCERIES").map((a) => <ArticleCard key={a.slug} iso={country.isoCode} a={a} />)}</div>
            </section>
          )}

          {articles.length > 0 && (
            <section id="articles" className="scroll-mt-24">
              <SectionTitle>All articles</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">{articles.map((a) => <ArticleCard key={a.slug} iso={country.isoCode} a={a} />)}</div>
            </section>
          )}

          <p className="flex items-center gap-2 text-xs text-subtle"><Phone className="h-3.5 w-3.5" /> Spotted something outdated? Report it from any article and our team will update it.</p>
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ iso, a }: { iso: string; a: { slug: string; title: string; summary: string; category: string } }) {
  return (
    <Link href={`/guide/${iso.toLowerCase()}/${a.slug}`} className="card group block p-5 transition hover:border-line-strong">
      <Badge>{titleCase(a.category)}</Badge>
      <h3 className="mt-3 font-semibold">{a.title}</h3>
      <p className="mt-1 text-sm text-muted">{a.summary}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">Read <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
    </Link>
  );
}
