"use client";

import { useEffect, useState } from "react";
import { Combobox } from "@/components/combobox";

type Country = { id: number; name: string; flag: string | null; currency: string };

/** "Where are you from?" – used to convert prices into the person's home currency. */
export function HomeCountryPicker({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    fetch("/api/locations?level=countries").then((r) => (r.ok ? r.json() : [])).then(setCountries).catch(() => {});
  }, []);
  return (
    <div>
      <Combobox
        label="Where are you from?"
        options={countries.map((c) => ({ value: c.id, label: `${c.flag ?? ""} ${c.name}`.trim(), hint: c.currency }))}
        value={value}
        onChange={onChange}
        loading={countries.length === 0}
        placeholder="Your home country"
      />
      <p className="mt-1.5 text-xs text-subtle">We use it to show prices and exchange rates in your home currency.</p>
    </div>
  );
}
