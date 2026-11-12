"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Car, Compass, Home, Loader2, LocateFixed, Lock, MapPin, Phone, Plane, RefreshCw, Smartphone } from "lucide-react";
import { getPosition, hasLocationConsent, rememberLocationConsent, PositionError } from "@/lib/position";
import { formatMoney } from "@/lib/format";
import type { LocalBriefing } from "@/lib/locate";
import { CurrencyConverter } from "@/components/currency-converter";
import { cn } from "@/lib/cn";

const UBER_HERE = "https://m.uber.com/ul/?action=setPickup&pickup=my_location";

/**
 * "You're in Zürich" – detects where the person is (GPS) and turns it into local next steps:
 * guide & checklist, SIM cards, rides, emergency numbers, homes nearby, essentials, a trip.
 */
export function WhereAmI({ className, compact }: { className?: string; compact?: boolean }) {
  const [state, setState] = useState<{ status: "idle" | "locating" | "done" | "error"; briefing?: LocalBriefing; error?: string }>({ status: "idle" });

  const locate = useCallback(async () => {
    setState({ status: "locating" });
    try {
      const pos = await getPosition();
      rememberLocationConsent();
      const res = await fetch(`/api/locate?lat=${pos.lat}&lng=${pos.lng}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't work out where you are.");
      setState({ status: "done", briefing: data });
    } catch (err) {
      setState({ status: "error", error: err instanceof PositionError || err instanceof Error ? err.message : "Couldn't get your location." });
    }
  }, []);

  // If the person shared their location before, refresh it quietly on every visit.
  useEffect(() => {
    if (!hasLocationConsent()) return;
    const t = setTimeout(locate, 0);
    return () => clearTimeout(t);
  }, [locate]);

  if (state.status !== "done" || !state.briefing) {
    return (
      <section className={cn("relative overflow-hidden rounded-3xl border border-line bg-elev p-6", className)} aria-live="polite">
        <div className="absolute inset-0" style={{ background: "radial-gradient(70% 120% at 100% 0%, rgb(245 185 113 / 0.16), transparent)" }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warm/15 text-warm"><LocateFixed className="h-6 w-6" /></span>
          <div className="flex-1">
            <h2 className="font-semibold">Just arrived somewhere new?</h2>
            <p className="text-sm text-muted">
              {state.status === "error" ? state.error : "Share your location and Nira shows what to do right here: SIM cards, rides, emergency numbers, places to stay and the local guide."}
            </p>
          </div>
          <button onClick={locate} disabled={state.status === "locating"} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-warm px-5 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-60">
            {state.status === "locating" ? <><Loader2 className="h-4 w-4 animate-spin" /> Finding you…</> : <><MapPin className="h-4 w-4" /> Use my location</>}
          </button>
        </div>
      </section>
    );
  }

  const b = state.briefing;
  const iso = b.country.isoCode.toLowerCase();
  const near = `lat=${b.position.lat}&lng=${b.position.lng}`;
  const cheapestSim = b.sims.filter((s) => s.cheapest).sort((x, y) => (x.cheapest!.price ?? 0) - (y.cheapest!.price ?? 0))[0];
  const rideHailing = b.rides.filter((r) => r.kind === "RIDE_HAILING" || r.kind === "TAXI");
  const hasUber = b.rides.some((r) => r.name === "Uber");

  return (
    <section className={cn("overflow-hidden rounded-3xl border border-line bg-elev", className)} aria-label="Where you are">
      <div className="relative p-6" style={{ background: "radial-gradient(80% 140% at 0% 0%, rgb(236 72 153 / 0.28), transparent)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent"><LocateFixed className="h-3.5 w-3.5" /> You&apos;re here</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {b.country.flag} {b.city.name}, <span className="font-display italic">{b.country.name}</span>
            </h2>
            <p className="mt-1 text-sm text-muted">{b.city.region ? `${b.city.region} · ` : ""}Currency {b.country.currency}</p>
          </div>
          <button onClick={locate} className="rounded-xl p-2 text-subtle hover:bg-soft hover:text-fg" aria-label="Refresh my location"><RefreshCw className="h-4 w-4" /></button>
        </div>

        {b.emergency.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {b.emergency.map((e) => (
              <a key={e.service} href={`tel:${e.number}`} className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger">
                <Phone className="h-3 w-3" /> {e.number} <span className="opacity-75">{e.service}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className={cn("grid gap-px bg-line", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
        <Tile href={`/guide/${iso}`} icon={<BookOpen />} title="What to do first" text={b.guide.articles ? `${b.guide.articles} guide articles · ${b.guide.checklist}-step first-week checklist` : `Emergency numbers, costs and basics for ${b.country.name}`} />
        <Tile href={`/guide/${iso}#sim`} icon={<Smartphone />} title="Get a local SIM" text={cheapestSim?.cheapest ? `From ${formatMoney(cheapestSim.cheapest.price, cheapestSim.cheapest.currency, { decimals: 2 })}/mo with ${cheapestSim.name} · bring your passport` : "Compare operators and prepaid plans in the guide"} />
        <div className="bg-elev p-5">
          <div className="flex items-center gap-2 font-semibold"><Car className="h-4 w-4 text-accent" /> Get a ride</div>
          {rideHailing.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {hasUber && <a href={UBER_HERE} target="_blank" rel="noreferrer" className="rounded-lg bg-fg px-3 py-1.5 text-xs font-semibold text-bg">Open Uber</a>}
              {rideHailing.filter((r) => r.name !== "Uber").map((r) =>
                r.phone ? (
                  <a key={r.name} href={`tel:${r.phone.replace(/\s/g, "")}`} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-soft">{r.name} · {r.phone}</a>
                ) : r.website ? (
                  <a key={r.name} href={r.website} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-soft">{r.name}</a>
                ) : (
                  <span key={r.name} className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted">{r.name}</span>
                ),
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No ride apps listed yet — see public transport in the guide.</p>
          )}
          {b.costs.transportDay && <p className="mt-2 text-xs text-subtle">Public transport day pass ≈ {formatMoney(b.costs.transportDay.mid, b.costs.transportDay.currency)}</p>}
        </div>
        <Tile href={`/relocate?all=1&${near}&sort=nearest`} icon={<Home />} title="Places to stay nearby" text={b.listingsNearby ? `${b.listingsNearby} homes within 15 km, nearest first` : "Search homes anywhere in the country"} />
        <Tile href={`/essentials?${near}&cityId=${b.city.id}&label=${encodeURIComponent(b.city.name)}`} icon={<Compass />} title="Essentials around you" text="Supermarkets, pharmacies, hospitals, ATMs, SIM shops and stops – live map" />
        <Tile href={`/trip/new?cityId=${b.city.id}`} icon={<Plane />} title={`Plan a trip in ${b.city.name}`} text={b.costs.cheapMeal ? `Budget meals from ≈ ${formatMoney(b.costs.cheapMeal.mid, b.costs.cheapMeal.currency)}` : "Day-by-day plan that fits your budget"} />
      </div>
      <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-[1.4fr_1fr] sm:items-center">
        {b.home && b.home.currency !== b.country.currency ? (
          <CurrencyConverter home={b.home.currency} local={b.country.currency} compact />
        ) : b.home ? (
          <p className="text-sm text-muted">You&apos;re in your home currency ({b.country.currency}).</p>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/profile" className="font-medium text-accent hover:underline">Tell us where you&apos;re from</Link> to see live {b.country.currency} exchange rates in your home currency.
          </p>
        )}
        <Link href={`/essentials?group=money&${near}&label=${encodeURIComponent(b.city.name)}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line p-4 text-sm hover:bg-soft">
          <span><span className="block font-semibold">Exchange money nearby</span><span className="text-muted">Exchange offices, banks and ATMs on a live map</span></span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
      <p className="flex items-center gap-1.5 px-6 py-3 text-[11px] text-subtle"><Lock className="h-3 w-3" /> Your position is only used to find the nearest city and is never stored.</p>
    </section>
  );
}

function Tile({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="group bg-elev p-5 transition hover:bg-soft">
      <div className="flex items-center gap-2 font-semibold"><span className="text-accent [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{title}<ArrowRight className="ml-auto h-4 w-4 text-subtle transition group-hover:translate-x-0.5" /></div>
      <p className="mt-1.5 text-sm text-muted">{text}</p>
    </Link>
  );
}
