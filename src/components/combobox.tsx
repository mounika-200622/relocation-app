"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputClass } from "@/components/ui/field";

export type Option = { value: number; label: string; hint?: string };

/** Searchable select (WAI-ARIA combobox pattern): type to filter, arrows to move, Enter to pick. */
export function Combobox({
  label, options, value, onChange, placeholder = "Select…", disabled, loading, hideLabel, emptyText = "No matches",
}: {
  label: string; options: Option[]; value: number | null; onChange: (v: number | null) => void; placeholder?: string;
  disabled?: boolean; loading?: boolean; hideLabel?: boolean; emptyText?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 300);
    const starts: Option[] = [];
    const contains: Option[] = [];
    for (const o of options) {
      const l = o.label.toLowerCase();
      if (l.startsWith(q)) starts.push(o);
      else if (l.includes(q)) contains.push(o);
      if (starts.length > 300) break;
    }
    return [...starts, ...contains].slice(0, 300);
  }, [options, query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (o: Option) => {
    onChange(o.value);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5" ref={wrap}>
      <label htmlFor={id} className={cn("text-[13px] font-medium text-muted", hideLabel && "sr-only")}>{label}</label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${id}-opt-${filtered[active]!.value}` : undefined}
          disabled={disabled}
          className={cn(inputClass, "pr-9")}
          placeholder={selected ? selected.label : placeholder}
          value={open ? query : selected?.label ?? ""}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open && filtered[active]) {
              e.preventDefault();
              choose(filtered[active]!);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
        </span>
        {open && !disabled && (
          <ul id={`${id}-list`} ref={list} role="listbox" className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-elev p-1 shadow-2xl">
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-subtle">{loading ? "Loading…" : emptyText}</li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={o.value}
                  id={`${id}-opt-${o.value}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm", i === active ? "bg-soft text-fg" : "text-muted")}
                >
                  <span className="truncate">
                    {o.label}
                    {o.hint && <span className="ml-2 text-xs text-subtle">{o.hint}</span>}
                  </span>
                  {o.value === value && <Check className="h-4 w-4 text-accent" />}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
