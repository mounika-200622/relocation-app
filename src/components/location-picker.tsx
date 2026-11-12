"use client";

import { useEffect, useState } from "react";
import { Combobox, type Option } from "@/components/combobox";
import { cn } from "@/lib/cn";

export type LocationValue = { countryId: number | null; regionId: number | null; cityId: number | null };
export type CityMeta = { id: number; name: string; lat: number | null; lng: number | null; countryName: string; countryIso: string; currency: string };

type Country = { id: number; name: string; isoCode: string; flag: string | null; currency: string };

// The country list is the same for every picker on the page; fetch it once.
let countriesPromise: Promise<Country[]> | null = null;
function loadCountries() {
  countriesPromise ??= fetch("/api/locations?level=countries").then((r) => (r.ok ? r.json() : []));
  return countriesPromise;
}

/**
 * Cascading Country → State/Region → City picker backed by the database.
 * Accepts just an initial cityId and resolves the chain itself.
 */
export function LocationPicker({
  value, onChange, onCity, initialCityId, required, className, layout = "grid", labels,
}: {
  value?: LocationValue;
  onChange: (v: LocationValue) => void;
  onCity?: (city: CityMeta | null) => void;
  initialCityId?: number | null;
  required?: boolean;
  className?: string;
  layout?: "grid" | "stack";
  labels?: { country?: string; region?: string; city?: string };
}) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Option[]>([]);
  const [cities, setCities] = useState<(Option & { lat: number | null; lng: number | null; regionId: number | null })[]>([]);
  const [state, setState] = useState<LocationValue>(value ?? { countryId: null, regionId: null, cityId: null });
  const [loading, setLoading] = useState<{ regions?: boolean; cities?: boolean }>({});

  useEffect(() => {
    loadCountries().then(setCountries);
  }, []);

  // keep in sync when the parent controls the value
  useEffect(() => {
    if (value && (value.countryId !== state.countryId || value.regionId !== state.regionId || value.cityId !== state.cityId)) setState(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.countryId, value?.regionId, value?.cityId]);

  // resolve an initial city into its country + region
  useEffect(() => {
    if (!initialCityId) return;
    let alive = true;
    fetch(`/api/locations?level=resolve&cityId=${initialCityId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!alive || !c) return;
        const next = { countryId: c.country.id, regionId: c.region?.id ?? null, cityId: c.id };
        setState(next);
        onChange(next);
        onCity?.({ id: c.id, name: c.name, lat: c.lat, lng: c.lng, countryName: c.country.name, countryIso: c.country.isoCode, currency: c.country.currency });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCityId]);

  useEffect(() => {
    if (!state.countryId) {
      setRegions([]);
      return;
    }
    let alive = true;
    setLoading((l) => ({ ...l, regions: true }));
    fetch(`/api/locations?level=regions&countryId=${state.countryId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { id: number; name: string }[]) => alive && setRegions(rows.map((r) => ({ value: r.id, label: r.name }))))
      .finally(() => alive && setLoading((l) => ({ ...l, regions: false })));
    return () => {
      alive = false;
    };
  }, [state.countryId]);

  useEffect(() => {
    if (!state.countryId) {
      setCities([]);
      return;
    }
    let alive = true;
    setLoading((l) => ({ ...l, cities: true }));
    const qs = new URLSearchParams({ level: "cities", countryId: String(state.countryId) });
    if (state.regionId) qs.set("regionId", String(state.regionId));
    fetch(`/api/locations?${qs}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { id: number; name: string; regionId: number | null; lat: number | null; lng: number | null }[]) =>
        alive && setCities(rows.map((c) => ({ value: c.id, label: c.name, lat: c.lat, lng: c.lng, regionId: c.regionId }))),
      )
      .finally(() => alive && setLoading((l) => ({ ...l, cities: false })));
    return () => {
      alive = false;
    };
  }, [state.countryId, state.regionId]);

  const update = (next: LocationValue) => {
    setState(next);
    onChange(next);
  };

  const country = countries.find((c) => c.id === state.countryId);
  const req = required ? " *" : "";

  return (
    <div className={cn(layout === "grid" ? "grid gap-3 sm:grid-cols-3" : "flex flex-col gap-3", className)}>
      <Combobox
        label={(labels?.country ?? "Country") + req}
        options={countries.map((c) => ({ value: c.id, label: `${c.flag ?? ""} ${c.name}`.trim() }))}
        value={state.countryId}
        loading={countries.length === 0}
        onChange={(countryId) => {
          update({ countryId, regionId: null, cityId: null });
          onCity?.(null);
        }}
        placeholder="Search countries"
      />
      <Combobox
        label={labels?.region ?? "State / region"}
        options={regions}
        value={state.regionId}
        disabled={!state.countryId}
        loading={loading.regions}
        onChange={(regionId) => {
          update({ ...state, regionId, cityId: null });
          onCity?.(null);
        }}
        placeholder={state.countryId ? "All regions" : "Pick a country first"}
        emptyText="No regions listed"
      />
      <Combobox
        label={(labels?.city ?? "City") + req}
        options={cities}
        value={state.cityId}
        disabled={!state.countryId}
        loading={loading.cities}
        onChange={(cityId) => {
          const c = cities.find((x) => x.value === cityId);
          update({ ...state, regionId: state.regionId ?? c?.regionId ?? null, cityId });
          if (c && country) onCity?.({ id: c.value, name: c.label, lat: c.lat, lng: c.lng, countryName: country.name, countryIso: country.isoCode, currency: country.currency });
        }}
        placeholder={state.countryId ? "Search cities" : "Pick a country first"}
      />
    </div>
  );
}
