"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LocationPicker, type CityMeta } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { Chip, Field, Input, Segmented } from "@/components/ui/field";
import { api } from "@/lib/client";
import { DEFAULT_SPLIT, allocate, normalizeSplit, type Split } from "@/lib/budget";
import { formatMoney } from "@/lib/format";

const INTERESTS = [["CULTURE", "🏛 Culture"], ["FOOD", "🍜 Food"], ["NATURE", "🌲 Nature"], ["NIGHTLIFE", "🌙 Nightlife"], ["SHOPPING", "🛍 Shopping"], ["ADVENTURE", "🧗 Adventure"], ["FAMILY", "👨‍👩‍👧 Family"]] as const;
const CATS: [keyof Split, string, string][] = [["stay", "Stay", "bg-accent-strong"], ["food", "Food", "bg-warm"], ["activities", "Activities", "bg-success"], ["transport", "Transport", "bg-sky-500"]];
const STEPS = ["Fetching places from OpenStreetMap…", "Pricing stays, meals and sights…", "Grouping each day by distance…", "Balancing the budget…"];

export function TripForm({ initialCityId = null }: { initialCityId?: number | null }) {
  const router = useRouter();
  const [cityId, setCityId] = useState<number | null>(null);
  const [city, setCity] = useState<CityMeta | null>(null);
  const [f, setF] = useState({ days: 3, people: 2, budget: "", currency: "", startDate: "", style: "BALANCED", pace: "NORMAL", stayPreference: "ANY", title: "" });
  const [interests, setInterests] = useState<string[]>(["CULTURE", "FOOD"]);
  const [split, setSplit] = useState<Split>(DEFAULT_SPLIT);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 6000);
    return () => clearInterval(id);
  }, [busy]);

  const budget = Number(f.budget) || 0;
  const alloc = allocate(budget, split);
  const setShare = (k: keyof Split, value: number) => {
    // move the other categories proportionally so the total stays 100
    const others = CATS.map(([c]) => c).filter((c) => c !== k);
    const rest = 100 - value;
    const otherSum = others.reduce((s, c) => s + split[c], 0) || 1;
    const next = { ...split, [k]: value } as Split;
    for (const c of others) next[c] = (split[c] / otherSum) * rest;
    setSplit(normalizeSplit(next));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityId) return toast.error("Choose a city.");
    if (!budget) return toast.error("Enter your total budget.");
    setBusy(true);
    setStep(0);
    try {
      const r = await api<{ id: number; warnings: string[]; feasible: boolean }>("/api/trips", {
        method: "POST",
        json: { cityId, days: f.days, people: f.people, budget, currency: f.currency || city?.currency || "USD", startDate: f.startDate || null, style: f.style, pace: f.pace, stayPreference: f.stayPreference, interests, split, title: f.title || undefined },
      });
      if (!r.feasible) toast.warning(r.warnings[0] ?? "This budget is tight — check the plan.");
      else toast.success("Your trip is ready!");
      router.push(`/trip/${r.id}`);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card space-y-5 p-6 md:p-7">
        <h2 className="text-lg font-semibold">Where & when</h2>
        <LocationPicker required initialCityId={initialCityId} onChange={(l) => setCityId(l.cityId)} onCity={(c) => { setCity(c); if (c && !f.currency) setF((s) => ({ ...s, currency: c.currency })); }} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stepper label="Days" value={f.days} min={1} max={30} onChange={(days) => setF({ ...f, days })} />
          <Stepper label="People" value={f.people} min={1} max={20} onChange={(people) => setF({ ...f, people })} />
          <Field label="Start date" optional>{(a) => <Input {...a} type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />}</Field>
        </div>
      </section>

      <section className="card space-y-5 p-6 md:p-7">
        <h2 className="text-lg font-semibold">Budget</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Total budget for everyone">{(a) => <Input {...a} inputMode="numeric" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="1500" className="h-14 text-2xl font-semibold" />}</Field>
          <Field label="Currency">{(a) => <Input {...a} maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} className="h-14 text-lg" placeholder="CHF" />}</Field>
        </div>
        <div>
          <div className="mb-3 flex h-3 overflow-hidden rounded-full">
            {CATS.map(([k, , color]) => <div key={k} className={`${color} transition-all`} style={{ width: `${split[k]}%` }} />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {CATS.map(([k, label, color]) => (
              <label key={k} className="block">
                <span className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span><span className="tabular-nums text-muted">{split[k]}% {budget > 0 && `· ${formatMoney(alloc[k], f.currency || "USD")}`}</span></span>
                <input type="range" min={0} max={90} value={split[k]} onChange={(e) => setShare(k, Number(e.target.value))} className="mt-2 w-full accent-[var(--accent-strong)]" aria-label={`${label} share`} />
              </label>
            ))}
          </div>
          <button type="button" onClick={() => setSplit(DEFAULT_SPLIT)} className="mt-2 text-xs text-muted hover:text-fg">Reset to 40 / 30 / 20 / 10</button>
        </div>
      </section>

      <section className="card space-y-5 p-6 md:p-7">
        <h2 className="text-lg font-semibold">Your style</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><div className="mb-1.5 text-[13px] font-medium text-muted">Trip style</div><Segmented value={f.style} onChange={(style) => setF({ ...f, style })} options={[{ value: "BUDGET", label: "Budget" }, { value: "BALANCED", label: "Balanced" }, { value: "COMFORT", label: "Comfort" }]} /></div>
          <div><div className="mb-1.5 text-[13px] font-medium text-muted">Pace</div><Segmented value={f.pace} onChange={(pace) => setF({ ...f, pace })} options={[{ value: "RELAXED", label: "Relaxed" }, { value: "NORMAL", label: "Normal" }, { value: "PACKED", label: "Packed" }]} /></div>
          <div><div className="mb-1.5 text-[13px] font-medium text-muted">Where to sleep</div><Segmented value={f.stayPreference} onChange={(stayPreference) => setF({ ...f, stayPreference })} options={[{ value: "ANY", label: "Any" }, { value: "HOSTEL", label: "Hostel" }, { value: "HOTEL", label: "Hotel" }, { value: "APARTMENT", label: "Apartment" }]} /></div>
          <Field label="Trip name" optional>{(a) => <Input {...a} value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={city ? `${f.days} days in ${city.name}` : "Long weekend"} />}</Field>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-medium text-muted">Interests</div>
          <div className="flex flex-wrap gap-2">{INTERESTS.map(([v, l]) => <Chip key={v} active={interests.includes(v)} onClick={() => setInterests((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}>{l}</Chip>)}</div>
        </div>
      </section>

      <div className="sticky bottom-20 z-10 md:bottom-4">
        <Button type="submit" size="lg" className="w-full shadow-2xl" disabled={busy}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {STEPS[step]}</> : <><Sparkles className="h-4 w-4" /> Build my itinerary</>}
        </Button>
        {busy && <p className="mt-2 text-center text-xs text-subtle">The first plan for a city can take up to a minute while we fetch live map data.</p>}
      </div>
    </form>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-muted">{label}</div>
      <div className="flex h-11 items-center justify-between rounded-xl border border-line bg-soft px-1.5">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-hover" aria-label={`Fewer ${label.toLowerCase()}`}><Minus className="h-4 w-4" /></button>
        <span className="font-semibold tabular-nums" aria-live="polite">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-hover" aria-label={`More ${label.toLowerCase()}`}><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
