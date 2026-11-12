"use client";

import { useState } from "react";
import { ArrowRight, Footprints, Loader2, Train } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { api } from "@/lib/client";

type Leg = { mode: string; line: string | null; from: string; to: string; departure: string; arrival: string; platform: string | null; walkMinutes?: number };
type Conn = { departure: string; arrival: string; durationMinutes: number; transfers: number; products: string[]; legs: Leg[] };

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Live connection search (transport.opendata.ch for Switzerland). */
export function ConnectionSearch({ country, defaultFrom }: { country: string; defaultFrom?: string }) {
  const [from, setFrom] = useState(defaultFrom ?? "Zürich HB");
  const [to, setTo] = useState("");
  const [when, setWhen] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Conn[] | null>(null);
  const [open, setOpen] = useState<number | null>(0);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ country, from, to });
      if (when) {
        qs.set("date", when.slice(0, 10));
        qs.set("time", when.slice(11, 16));
      }
      const r = await api<{ connections: Conn[] }>(`/api/transit?${qs}`);
      setResults(r.connections);
      setOpen(0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Live connections</div>
      <form onSubmit={search} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <Input aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From (e.g. Zürich HB)" />
        <Input aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To (e.g. Bern)" />
        <Input aria-label="Departure time" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <Button type="submit" loading={loading} disabled={from.length < 2 || to.length < 2}>Search</Button>
      </form>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      {results && results.length === 0 && <p className="mt-4 text-sm text-muted">No connections found. Check the station names.</p>}
      {results && results.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
          {results.map((c, i) => (
            <li key={i}>
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-soft" aria-expanded={open === i}>
                <span className="text-lg font-semibold tabular-nums">{time(c.departure)}</span>
                <ArrowRight className="h-4 w-4 text-subtle" />
                <span className="text-lg font-semibold tabular-nums">{time(c.arrival)}</span>
                <span className="ml-auto text-right text-sm"><span className="block">{Math.floor(c.durationMinutes / 60)}h {c.durationMinutes % 60}m</span><span className="text-xs text-subtle">{c.transfers === 0 ? "direct" : `${c.transfers} change${c.transfers > 1 ? "s" : ""}`} · {c.products.join(", ")}</span></span>
              </button>
              {open === i && (
                <ol className="space-y-2 px-4 pb-4">
                  {c.legs.map((l, j) => (
                    <li key={j} className="flex gap-3 text-sm">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-soft">{l.mode === "WALK" ? <Footprints className="h-4 w-4" /> : <Train className="h-4 w-4 text-danger" />}</span>
                      <span>
                        <b>{l.line ?? `Walk${l.walkMinutes ? ` ${l.walkMinutes} min` : ""}`}</b> <span className="text-muted">{l.from} → {l.to}</span>
                        <span className="block text-xs text-subtle">{time(l.departure)}–{time(l.arrival)}{l.platform ? ` · platform ${l.platform}` : ""}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ul>
      )}
      {loading && <p className="mt-3 flex items-center gap-2 text-xs text-subtle"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Asking the Swiss timetable…</p>}
      <p className="mt-3 text-[11px] text-subtle">Data: transport.opendata.ch</p>
    </div>
  );
}
