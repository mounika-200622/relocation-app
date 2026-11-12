"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CitySearch, type CityHit } from "@/components/city-search";

const TYPES = [
  { value: "", label: "Any type" },
  { value: "DORM", label: "Dorm" },
  { value: "SHARED_ROOM", label: "Shared room" },
  { value: "PRIVATE_ROOM", label: "Private room" },
  { value: "STUDIO", label: "Studio" },
  { value: "APARTMENT", label: "Apartment" },
];

/** Segmented "Where · Budget · Type · Search" pill (stacks on phones). */
export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState<CityHit | null>(null);
  const [budget, setBudget] = useState("");
  const [type, setType] = useState("");

  const go = () => {
    const qs = new URLSearchParams();
    if (city) {
      qs.set("cityId", String(city.id));
      qs.set("city", `${city.name}, ${city.country.name}`);
    }
    if (budget) qs.set("maxPrice", budget);
    if (type) qs.set("type", type);
    router.push(`/relocate?${qs}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="relative mx-auto mt-10 flex w-full max-w-3xl flex-col gap-1 rounded-[1.75rem] border border-line-strong bg-elev/80 p-2 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] backdrop-blur-xl md:flex-row md:items-center md:rounded-full"
    >
      <label className="flex-[1.6] rounded-full px-5 py-2.5 transition hover:bg-soft">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">Where</span>
        <CitySearch onSelect={setCity} placeholder="Zürich, Geneva, Berlin…" inputClassName="text-[15px] text-fg !pl-0" className="[&_svg]:hidden" />
      </label>
      <span className="hidden h-8 w-px bg-line md:block" />
      <label className="flex-1 rounded-full px-5 py-2.5 transition hover:bg-soft">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">Max budget / month</span>
        <input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Any budget" className="w-full bg-transparent text-[15px] outline-none placeholder:text-subtle" />
      </label>
      <span className="hidden h-8 w-px bg-line md:block" />
      <label className="flex-1 rounded-full px-5 py-2.5 transition hover:bg-soft">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-transparent text-[15px] outline-none [&>option]:bg-elev">
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="flex h-14 items-center justify-center gap-2 rounded-full bg-accent-strong px-6 font-semibold text-white shadow-[0_10px_30px_-8px_rgb(99_102_241/0.8)] transition hover:brightness-110 md:h-14 md:w-14 md:px-0 lg:w-auto lg:px-6">
        <Search className="h-5 w-5" /> <span className="md:hidden lg:inline">Search</span>
      </button>
    </form>
  );
}
