"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bed, Bus, Copy, Landmark, Link2, Loader2, Pencil, Plus, Printer, RefreshCw, Shuffle, Trash2, Utensils } from "lucide-react";
import { toast } from "sonner";
import { MapPanel } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge, Progress } from "@/components/ui/misc";
import { api } from "@/lib/client";
import { formatDate, formatKm, formatMoney, titleCase } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { TripView } from "@/lib/trip/load";

const KIND_ICON = { STAY: Bed, FOOD: Utensils, ACTIVITY: Landmark, TRANSPORT: Bus } as const;
const SLOT_LABEL: Record<string, string> = { STAY: "Stay", MORNING: "Morning", LUNCH: "Lunch", AFTERNOON: "Afternoon", DINNER: "Dinner", EVENING: "Evening" };
const CAT_COLOR: Record<string, string> = { stay: "bg-accent-strong", food: "bg-warm", activities: "bg-success", transport: "bg-sky-500" };
type Alt = { poiId: number; name: string; category: string; distanceKm: number; priceTier: number | null; estimatedCost: number };

export function ItineraryView({ trip, readOnly = false }: { trip: TripView; readOnly?: boolean }) {
  const router = useRouter();
  const [day, setDay] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(trip.title);
  const [swap, setSwap] = useState<{ itemId: number; title: string; alts: Alt[] | null } | null>(null);
  const [adding, setAdding] = useState(false);
  const [add, setAdd] = useState({ title: "", estimatedCost: "", timeSlot: "AFTERNOON" });
  const money = (n: number) => formatMoney(n, trip.currency);

  const stay = trip.items.find((i) => i.kind === "STAY");
  const dayItems = useMemo(() => trip.items.filter((i) => i.dayNumber === day && i.kind !== "STAY"), [trip.items, day]);
  const markers = useMemo(() => {
    const pts = dayItems.filter((i) => i.lat !== null && i.lng !== null);
    return [
      ...(stay?.lat && stay.lng ? [{ id: "stay", lat: stay.lat, lng: stay.lng, kind: "home" as const, label: "★", title: stay.title }] : []),
      ...pts.map((i, n) => ({ id: i.id, lat: i.lat!, lng: i.lng!, label: String(n + 1), title: i.title })),
    ];
  }, [dayItems, stay]);

  const action = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const tripAction = (a: "regenerate" | "duplicate" | "share" | "unshare") =>
    action(a, async () => {
      const r = await api<{ id?: number; url?: string; warnings?: string[] }>(`/api/trips/${trip.id}/actions`, { method: "POST", json: { action: a } });
      if (a === "duplicate" && r.id) {
        toast.success("Trip duplicated");
        router.push(`/trip/${r.id}`);
      } else if (a === "share" && r.url) {
        await navigator.clipboard.writeText(`${window.location.origin}${r.url}`).catch(() => {});
        toast.success("Read-only link copied");
        router.refresh();
      } else {
        toast.success(a === "regenerate" ? "Fresh plan generated" : "Sharing turned off");
        router.refresh();
      }
    });

  const openSwap = (itemId: number, t: string) => {
    setSwap({ itemId, title: t, alts: null });
    api<{ items: Alt[] }>(`/api/trips/${trip.id}/items/${itemId}`).then((r) => setSwap({ itemId, title: t, alts: r.items })).catch((e) => toast.error((e as Error).message));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      {/* header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-accent">{trip.city.country.flag} {trip.city.name}, {trip.city.country.name}</p>
          {renaming ? (
            <form
              className="mt-1 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                action("rename", async () => {
                  await api(`/api/trips/${trip.id}`, { method: "PATCH", json: { title } });
                  setRenaming(false);
                  router.refresh();
                });
              }}
            >
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus className="h-12 text-2xl font-semibold" aria-label="Trip name" />
              <Button type="submit" loading={busy === "rename"}>Save</Button>
            </form>
          ) : (
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {trip.title}
              {!readOnly && <button onClick={() => setRenaming(true)} className="no-print rounded-lg p-1.5 text-subtle hover:bg-soft hover:text-fg" aria-label="Rename trip"><Pencil className="h-5 w-5" /></button>}
            </h1>
          )}
          <p className="mt-2 text-muted">
            {trip.days} days · {trip.people} {trip.people === 1 ? "person" : "people"} · {trip.rooms} room{trip.rooms > 1 ? "s" : ""}
            {trip.startDate && ` · from ${formatDate(trip.startDate)}`} · {titleCase(trip.style)} · {titleCase(trip.pace)} pace
          </p>
          {trip.interests.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{trip.interests.map((i) => <Badge key={i}>{titleCase(i)}</Badge>)}</div>}
        </div>
        {!readOnly && (
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => tripAction("regenerate")} loading={busy === "regenerate"}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</Button>
            <Button variant="secondary" size="sm" onClick={() => tripAction("duplicate")} loading={busy === "duplicate"}><Copy className="h-3.5 w-3.5" /> Duplicate</Button>
            <Button variant="secondary" size="sm" onClick={() => tripAction(trip.shareToken ? "unshare" : "share")} loading={busy === "share" || busy === "unshare"}><Link2 className="h-3.5 w-3.5" /> {trip.shareToken ? "Stop sharing" : "Share link"}</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print / PDF</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => confirm("Delete this trip?") && action("delete", async () => { await api(`/api/trips/${trip.id}`, { method: "DELETE" }); router.push("/trip"); })}
              aria-label="Delete trip"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {trip.shareToken && !readOnly && (
        <p className="no-print mt-3 text-xs text-subtle">Shared at <code className="text-accent">/share/{trip.shareToken}</code> — anyone with the link can view (not edit).</p>
      )}

      {trip.minViableBudget !== null && trip.minViableBudget > trip.budget && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your budget of {money(trip.budget)} is below the minimum we can plan for these dates — about <b>{money(trip.minViableBudget)}</b> for the cheapest stay, meals and transport. The plan below skips what doesn&apos;t fit.</span>
        </div>
      )}

      {/* budget meter */}
      <section className="mt-8 card p-6" aria-label="Budget">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm text-muted">Planned spend</div>
            <div className="text-3xl font-semibold tabular-nums">{money(trip.meter.totalSpent)} <span className="text-lg text-subtle">/ {money(trip.budget)}</span></div>
          </div>
          <div className={cn("text-sm font-medium", trip.meter.overBudget ? "text-danger" : "text-success")}>{trip.meter.overBudget ? `${money(-trip.meter.remaining)} over budget` : `${money(trip.meter.remaining)} left`}</div>
        </div>
        <Progress value={(trip.meter.totalSpent / Math.max(1, trip.budget)) * 100} tone={trip.meter.overBudget ? "danger" : "accent"} className="mt-4 h-3" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trip.meter.categories.map((c) => (
            <div key={c.category}>
              <div className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${CAT_COLOR[c.category]}`} />{titleCase(c.category)}</span><span className="tabular-nums text-muted">{money(c.spent)} / {money(c.cap)}</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-hover"><div className={`h-full rounded-full ${c.spent > c.cap ? "bg-danger" : CAT_COLOR[c.category]}`} style={{ width: `${Math.min(100, (c.spent / Math.max(1, c.cap)) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      {stay && (
        <section className="mt-6 card flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Bed className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><div className="text-xs uppercase tracking-wider text-subtle">Where you&apos;ll stay</div><div className="truncate font-semibold">{stay.title}</div>{stay.notes && <div className="text-xs text-subtle">{stay.notes}</div>}</div>
          <div className="text-right font-semibold tabular-nums">{money(stay.estimatedCost)}</div>
          {!readOnly && stay.poiId && <button onClick={() => openSwap(stay.id, stay.title)} className="no-print rounded-lg p-2 text-subtle hover:bg-soft hover:text-fg" aria-label="Swap stay"><Shuffle className="h-4 w-4" /></button>}
        </section>
      )}

      {/* days */}
      <div className="no-print no-scrollbar mt-8 flex gap-2 overflow-x-auto" role="tablist" aria-label="Days">
        {Array.from({ length: trip.days }, (_, i) => i + 1).map((d) => (
          <button key={d} role="tab" aria-selected={day === d} onClick={() => setDay(d)} className={cn("shrink-0 rounded-full px-4 h-10 text-sm font-medium transition", day === d ? "bg-fg text-bg" : "bg-soft text-muted hover:text-fg")}>
            Day {d}
            {trip.startDate && <span className="ml-1.5 text-xs opacity-70">{formatDate(new Date(new Date(trip.startDate).getTime() + (d - 1) * 86_400_000), { weekday: "short" })}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-line">
          {dayItems.length === 0 && <li className="card p-6 text-sm text-muted">Nothing planned for this day.</li>}
          {dayItems.map((i) => {
            const Icon = KIND_ICON[i.kind];
            const numbered = markers.findIndex((m) => m.id === i.id);
            return (
              <li key={i.id} className="relative flex gap-4">
                <span className={cn("relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-bg", i.kind === "FOOD" ? "bg-warm text-black" : i.kind === "ACTIVITY" ? "bg-success text-black" : "bg-sky-500 text-white")}>
                  {numbered > 0 ? <span className="text-xs font-bold">{numbered}</span> : <Icon className="h-4 w-4" />}
                </span>
                <div className="card flex min-w-0 flex-1 items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{SLOT_LABEL[i.timeSlot]}</div>
                    <div className="truncate font-medium">{i.title}</div>
                    {i.category && <div className="text-xs text-subtle">{titleCase(i.category)}</div>}
                    {i.notes && <div className="mt-1 text-xs text-muted">{i.notes}</div>}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums">{i.estimatedCost === 0 ? "Free" : money(i.estimatedCost)}</div>
                    {!readOnly && (
                      <div className="no-print mt-1 flex justify-end gap-0.5">
                        {i.poiId && <button onClick={() => openSwap(i.id, i.title)} className="rounded-lg p-1.5 text-subtle hover:bg-soft hover:text-fg" aria-label={`Swap ${i.title}`}><Shuffle className="h-3.5 w-3.5" /></button>}
                        <button onClick={() => action(`rm${i.id}`, async () => { await api(`/api/trips/${trip.id}/items/${i.id}`, { method: "DELETE" }); router.refresh(); })} className="rounded-lg p-1.5 text-subtle hover:bg-soft hover:text-danger" aria-label={`Remove ${i.title}`}>
                          {busy === `rm${i.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {!readOnly && (
            <li className="no-print relative pl-14">
              <Button variant="ghost" size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add to day {day}</Button>
            </li>
          )}
        </ol>
        <div className="no-print h-[420px] overflow-hidden rounded-3xl border border-line lg:sticky lg:top-24">
          <MapPanel height="100%" markers={markers} center={trip.city.lat && trip.city.lng ? [trip.city.lat, trip.city.lng] : undefined} />
        </div>
      </div>

      {/* print: every day */}
      <div className="hidden print:block">
        {Array.from({ length: trip.days }, (_, i) => i + 1).map((d) => (
          <div key={d} className="mt-6">
            <h2 className="font-semibold">Day {d}</h2>
            <ul className="text-sm">{trip.items.filter((i) => i.dayNumber === d && i.kind !== "STAY").map((i) => <li key={i.id}>{SLOT_LABEL[i.timeSlot]} — {i.title} — {i.estimatedCost === 0 ? "free" : money(i.estimatedCost)}</li>)}</ul>
          </div>
        ))}
      </div>

      <Modal open={swap !== null} onClose={() => setSwap(null)} title={`Swap “${swap?.title ?? ""}”`}>
        {swap?.alts === null ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : swap?.alts?.length === 0 ? (
          <p className="text-sm text-muted">No alternatives in the same price range nearby.</p>
        ) : (
          <ul className="space-y-2">
            {swap?.alts?.map((a) => (
              <li key={a.poiId}>
                <button
                  onClick={() => action(`swap${a.poiId}`, async () => { await api(`/api/trips/${trip.id}/items/${swap.itemId}`, { method: "PATCH", json: { poiId: a.poiId } }); setSwap(null); toast.success("Swapped"); router.refresh(); })}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line p-4 text-left hover:border-accent"
                >
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{a.name}</span><span className="text-xs text-subtle">{titleCase(a.category)} · {formatKm(a.distanceKm)} away{a.priceTier ? ` · tier ${a.priceTier}` : ""}</span></span>
                  <span className="font-semibold tabular-nums">{a.estimatedCost === 0 ? "Free" : money(a.estimatedCost)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title={`Add to day ${day}`}>
        <div className="space-y-4">
          <Field label="What">{(a) => <Input {...a} value={add.title} onChange={(e) => setAdd({ ...add, title: e.target.value })} placeholder="Boat trip on the lake" maxLength={200} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="When">{(a) => <Select {...a} value={add.timeSlot} onChange={(e) => setAdd({ ...add, timeSlot: e.target.value })}>{["MORNING", "LUNCH", "AFTERNOON", "DINNER", "EVENING"].map((s) => <option key={s} value={s}>{SLOT_LABEL[s]}</option>)}</Select>}</Field>
            <Field label={`Cost (${trip.currency})`}>{(a) => <Input {...a} inputMode="decimal" value={add.estimatedCost} onChange={(e) => setAdd({ ...add, estimatedCost: e.target.value.replace(/[^\d.]/g, "") })} placeholder="0" />}</Field>
          </div>
          <Button
            className="w-full"
            disabled={!add.title.trim()}
            loading={busy === "add"}
            onClick={() => action("add", async () => {
              await api(`/api/trips/${trip.id}/items`, { method: "POST", json: { dayNumber: day, timeSlot: add.timeSlot, title: add.title, estimatedCost: Number(add.estimatedCost || 0) } });
              setAdding(false);
              setAdd({ title: "", estimatedCost: "", timeSlot: "AFTERNOON" });
              router.refresh();
            })}
          >
            Add — the budget meter updates
          </Button>
        </div>
      </Modal>
    </div>
  );
}
