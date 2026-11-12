"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type CityHit = {
  id: number; name: string; lat: number | null; lng: number | null;
  region: { name: string } | null; country: { name: string; isoCode: string; flag: string | null; currency: string }; _count: { listings: number };
};

/** Type-ahead city search across every country (debounced, keyboard accessible). */
export function CitySearch({
  onSelect, placeholder = "Search any city", className, inputClassName, initialLabel, autoFocus,
}: { onSelect: (c: CityHit) => void; placeholder?: string; className?: string; inputClassName?: string; initialLabel?: string; autoFocus?: boolean }) {
  const id = useId();
  const [q, setQ] = useState(initialLabel ?? "");
  const [hits, setHits] = useState<CityHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const picked = useRef(false);

  useEffect(() => {
    if (picked.current) {
      picked.current = false;
      return;
    }
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations?level=search&q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          setHits(await res.json());
          setOpen(true);
          setActive(0);
        }
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (c: CityHit) => {
    picked.current = true;
    setQ(`${c.name}, ${c.country.name}`);
    setOpen(false);
    onSelect(c);
  };

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-label="City"
          autoFocus={autoFocus}
          value={q}
          placeholder={placeholder}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open && hits[active]) {
              e.preventDefault();
              choose(hits[active]!);
            } else if (e.key === "Escape") setOpen(false);
          }}
          className={cn("w-full bg-transparent pl-6 outline-none placeholder:text-subtle", inputClassName)}
        />
        {loading && <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 animate-ping rounded-full bg-accent/60" />}
      </div>
      {open && q.trim().length >= 2 && hits.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-3 min-w-[18rem] overflow-hidden rounded-2xl border border-line bg-elev p-1.5 shadow-2xl animate-fade-up">
          {hits.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(c)}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5", i === active && "bg-soft")}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-soft text-lg">{c.country.flag ?? <MapPin className="h-4 w-4" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{c.name}</span>
                <span className="block truncate text-xs text-subtle">{[c.region?.name, c.country.name].filter(Boolean).join(", ")}</span>
              </span>
              {c._count.listings > 0 && <span className="text-[11px] font-medium text-accent">{c._count.listings} places</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
