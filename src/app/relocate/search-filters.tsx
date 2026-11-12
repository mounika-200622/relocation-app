"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { List, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { CitySearch } from "@/components/city-search";
import { Chip, Field, Input, Select, Switch } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

type Flat = Record<string, string | undefined>;
type Amenity = { id: number; label: string };

const TYPES = [["", "All"], ["DORM", "Dorms"], ["SHARED_ROOM", "Shared rooms"], ["PRIVATE_ROOM", "Private rooms"], ["STUDIO", "Studios"], ["APARTMENT", "Apartments"]] as const;

/** All filter state lives in the URL query string, so every search is shareable. */
export function SearchFilters({ initial, budget, total }: { initial: Flat; budget: { amount: number; currency: string } | null; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Flat>(initial);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  useEffect(() => {
    fetch("/api/amenities").then((r) => (r.ok ? r.json() : [])).then(setAmenities).catch(() => {});
  }, []);

  const apply = (next: Flat) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v !== undefined && v !== "" && k !== "page") qs.set(k, v);
    start(() => router.push(`${pathname}?${qs}`, { scroll: false }));
  };
  const patch = (p: Flat) => apply({ ...initial, ...p });
  const bool = (k: string) => draft[k] === "true";
  const toggle = (k: string) => setDraft((d) => ({ ...d, [k]: d[k] === "true" ? undefined : "true" }));
  const selectedAmenities = (draft.amenities ?? "").split(",").filter(Boolean);
  const activeCount = ["minPrice", "maxPrice", "shareable", "openSpots", "furnished", "gender", "availableBy", "bedrooms", "amenities", "q"].filter((k) => initial[k]).length;

  return (
    <div className={cn("sticky top-16 z-30 -mx-4 bg-bg/85 px-4 pb-3 pt-2 backdrop-blur-xl md:-mx-6 md:px-6", pending && "opacity-80")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-line-strong bg-elev px-5 py-3 shadow-sm">
          <CitySearch
            key={initial.cityId ?? "none"}
            initialLabel={initial.city}
            placeholder="Search a city"
            className="flex-1"
            inputClassName="text-[15px]"
            onSelect={(c) => apply({ ...initial, all: undefined, cityId: String(c.id), city: `${c.name}, ${c.country.name}`, countryId: undefined, regionId: undefined, lat: c.lat ? String(c.lat) : undefined, lng: c.lng ? String(c.lng) : undefined })}
          />
          {initial.cityId && (
            <button onClick={() => apply({ ...initial, cityId: undefined, city: undefined, lat: undefined, lng: undefined, all: "1" })} className="rounded-full p-1 text-subtle hover:text-fg" aria-label="Clear city">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Select aria-label="Sort" value={initial.sort ?? "newest"} onChange={(e) => patch({ sort: e.target.value })} className="h-11 min-w-0 flex-1 rounded-full md:w-auto md:flex-none">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="nearest" disabled={!initial.lat}>Nearest to centre</option>
          </Select>
          <Button variant="secondary" className="h-11 shrink-0 rounded-full" onClick={() => setOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters {activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-strong px-1 text-[11px] text-white">{activeCount}</span>}
          </Button>
          <Button variant="secondary" className="h-11 shrink-0 rounded-full" onClick={() => patch({ view: initial.view === "map" ? undefined : "map" })} aria-label="Toggle map view">
            {initial.view === "map" ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
            <span className="hidden sm:inline">{initial.view === "map" ? "List" : "Map"}</span>
          </Button>
        </div>
      </div>

      <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto">
        {TYPES.map(([v, l]) => (
          <Chip key={v} active={(initial.type ?? "") === v} onClick={() => patch({ type: v || undefined })}>{l}</Chip>
        ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-line" />
        <Chip active={initial.openSpots === "true"} onClick={() => patch({ openSpots: initial.openSpots === "true" ? undefined : "true" })}>Has open spots</Chip>
        {budget && (
          <Chip active={initial.maxPrice === String(budget.amount)} onClick={() => patch({ maxPrice: initial.maxPrice === String(budget.amount) ? undefined : String(budget.amount) })}>
            Within my budget ({formatMoney(budget.amount, budget.currency)})
          </Chip>
        )}
        <span className="ml-auto shrink-0 pl-3 text-sm text-subtle">{total} place{total === 1 ? "" : "s"}</span>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Filters" wide>
        <div className="space-y-7">
          <Field label="Keywords" optional>{(a) => <Input {...a} value={draft.q ?? ""} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="balcony, near ETH, garden…" />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Min price / month">{(a) => <Input {...a} inputMode="numeric" value={draft.minPrice ?? ""} onChange={(e) => setDraft({ ...draft, minPrice: e.target.value.replace(/\D/g, "") })} />}</Field>
            <Field label="Max price / month">{(a) => <Input {...a} inputMode="numeric" value={draft.maxPrice ?? ""} onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value.replace(/\D/g, "") })} />}</Field>
            <Field label="Available by">{(a) => <Input {...a} type="date" value={draft.availableBy ?? ""} onChange={(e) => setDraft({ ...draft, availableBy: e.target.value })} />}</Field>
            <Field label="Bedrooms (at least)">
              {(a) => (
                <Select {...a} value={draft.bedrooms ?? ""} onChange={(e) => setDraft({ ...draft, bedrooms: e.target.value })}>
                  <option value="">Any</option>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
                </Select>
              )}
            </Field>
            <Field label="Who can live there">
              {(a) => (
                <Select {...a} value={draft.gender ?? ""} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
                  <option value="">Any rule</option><option value="ANYONE">Open to anyone</option><option value="FEMALE_ONLY">Women welcome</option><option value="MALE_ONLY">Men welcome</option>
                </Select>
              )}
            </Field>
          </div>
          <div className="card divide-y divide-line px-4">
            <div className="py-3"><Switch label="Shareable only" description="Places you can share with roommates" checked={bool("shareable")} onChange={() => toggle("shareable")} /></div>
            <div className="py-3"><Switch label="Has open spots" checked={bool("openSpots")} onChange={() => toggle("openSpots")} /></div>
            <div className="py-3"><Switch label="Furnished" checked={bool("furnished")} onChange={() => toggle("furnished")} /></div>
          </div>
          {amenities.length > 0 && (
            <div>
              <div className="mb-2 text-[13px] font-medium text-muted">Amenities (must have all)</div>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => {
                  const on = selectedAmenities.includes(String(a.id));
                  return (
                    <Chip key={a.id} active={on} onClick={() => setDraft({ ...draft, amenities: (on ? selectedAmenities.filter((x) => x !== String(a.id)) : [...selectedAmenities, String(a.id)]).join(",") || undefined })}>
                      {a.label}
                    </Chip>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-line pt-5">
            <button className="text-sm font-medium underline-offset-4 hover:underline" onClick={() => setDraft({ cityId: draft.cityId, city: draft.city, lat: draft.lat, lng: draft.lng })}>Clear all</button>
            <Button onClick={() => { apply(draft); setOpen(false); }}>Show places</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
