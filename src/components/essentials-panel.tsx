"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, ExternalLink, Loader2, MapPin, WifiOff } from "lucide-react";
import { MapPanel, type MapMarker } from "@/components/map";
import { Chip } from "@/components/ui/field";
import { Badge, EmptyState } from "@/components/ui/misc";
import { formatKm, formatRange } from "@/lib/format";
import { cn } from "@/lib/cn";

const GROUPS = [
  ["food", "Food"], ["groceries", "Groceries"], ["health", "Health"], ["transit", "Transit"], ["money", "Banks & ATMs"], ["phone", "SIM & phone"], ["daily", "Daily life"], ["study", "Study"],
] as const;
type Group = (typeof GROUPS)[number][0];

type Poi = {
  id: number; osmId: string; name: string; category: string; lat: number; lng: number; distanceKm: number; address: string | null;
  openingHours: string | null; cuisine: string | null; priceTier: number | null; free: boolean; price: { min: number; max: number; mid: number; currency: string } | null;
};

const LABEL: Record<string, string> = {
  RESTAURANT: "Restaurant", CAFE: "Café", FAST_FOOD: "Fast food", SUPERMARKET: "Supermarket", CONVENIENCE: "Convenience", HOSPITAL: "Hospital", CLINIC: "Clinic",
  PHARMACY: "Pharmacy", DOCTOR: "Doctor", BANK: "Bank", ATM: "ATM", TRANSIT: "Stop", MOBILE_SHOP: "Phone shop", LAUNDRY: "Laundry", GYM: "Gym",
  UNIVERSITY: "University", POST_OFFICE: "Post office", POLICE: "Police",
};

/** Live nearby places around a point: tabs per category group, radius, budget filter, list + map. */
export function EssentialsPanel({ lat, lng, cityId, title = "Nearby essentials", initialGroup = "groceries" }: { lat: number; lng: number; cityId?: number | null; title?: string; initialGroup?: Group }) {
  const [group, setGroup] = useState<Group>(initialGroup);
  const [radius, setRadius] = useState(1500);
  const [maxMeal, setMaxMeal] = useState("");
  const [data, setData] = useState<{ items: Poi[]; stale: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 2500);
    const qs = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius), group });
    if (cityId) qs.set("cityId", String(cityId));
    fetch(`/api/poi?${qs}`, { signal: ctrl.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Couldn't load nearby places.");
        setData(d);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      })
      .finally(() => {
        clearTimeout(slowTimer);
        setLoading(false);
      });
    return () => {
      clearTimeout(slowTimer);
      ctrl.abort();
    };
  }, [lat, lng, radius, group, cityId]);

  const items = useMemo(() => {
    const all = data?.items ?? [];
    const cap = Number(maxMeal);
    return group === "food" && cap > 0 ? all.filter((i) => !i.price || i.price.mid <= cap) : all;
  }, [data, maxMeal, group]);

  return (
    <section aria-labelledby="essentials-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="essentials-title" className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted">Live from OpenStreetMap, refreshed weekly.</p>
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          Radius
          <input type="range" min={500} max={5000} step={500} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-36 accent-[var(--accent-strong)]" aria-label="Search radius" />
          <span className="w-14 tabular-nums text-fg">{formatKm(radius / 1000)}</span>
        </label>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {GROUPS.map(([g, l]) => <Chip key={g} active={group === g} onClick={() => setGroup(g)}>{l}</Chip>)}
      </div>

      {group === "food" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          Max per meal
          <input inputMode="numeric" value={maxMeal} onChange={(e) => setMaxMeal(e.target.value.replace(/\D/g, ""))} placeholder="any" className="h-9 w-20 rounded-lg border border-line bg-soft px-2 text-fg outline-none" aria-label="Maximum price per meal" />
          <span className="text-xs text-subtle">Prices are estimates from local cost data — OSM has no menus.</span>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <div className="card max-h-[460px] overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {slow && <p className="flex items-center gap-2 px-1 pb-2 text-xs text-subtle"><Loader2 className="h-3.5 w-3.5 animate-spin" /> First look at this area — fetching live map data, this can take up to a minute.</p>}
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-danger">{error}</div>
          ) : items.length === 0 ? (
            <EmptyState icon={<MapPin className="h-6 w-6" />} title="Nothing found nearby">Try a larger radius.</EmptyState>
          ) : (
            <ul>
              {data?.stale && <li className="flex items-center gap-2 px-3 py-2 text-xs text-warning"><WifiOff className="h-3.5 w-3.5" /> Live data is unavailable – showing saved results.</li>}
              {items.map((p, i) => (
                <li key={p.id}>
                  <button onClick={() => setSelected(p.id)} className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-soft", selected === p.id && "bg-soft")}>
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        <Badge className="shrink-0">{LABEL[p.category] ?? p.category}</Badge>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-subtle">{[p.cuisine?.replace(/_/g, " "), p.address].filter(Boolean).join(" · ") || "Address not listed"}</span>
                      {p.openingHours && <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-subtle"><Clock className="h-3 w-3" />{p.openingHours}</span>}
                      <span className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-medium text-fg">{formatKm(p.distanceKm)}</span>
                        {p.price && <span className="text-warm">~{formatRange(p.price.min, p.price.max, p.price.currency)} <span className="text-subtle">est.</span></span>}
                        <a href={`https://www.openstreetmap.org/${p.osmId.startsWith("google/") ? `?mlat=${p.lat}&mlon=${p.lng}` : p.osmId}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-0.5 text-muted hover:text-fg">OSM <ExternalLink className="h-3 w-3" /></a>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-0.5 text-muted hover:text-fg">Google Maps <ExternalLink className="h-3 w-3" /></a>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="h-[360px] overflow-hidden rounded-3xl border border-line lg:h-[460px]">
          <MapPanel
            height="100%"
            center={[lat, lng]}
            radiusM={radius}
            fit={false}
            markers={([
              { id: "home", lat, lng, kind: "home" as const, label: "★", title: "Your place" },
              ...items.slice(0, 60).map((p, i) => ({ id: p.id, lat: p.lat, lng: p.lng, label: String(i + 1), title: p.name })),
            ] as MapMarker[]).filter((m) => selected === null || m.id === "home" || m.id === selected || items.length < 60)}
          />
        </div>
      </div>
    </section>
  );
}
