import { BadgeCheck, Check, Heart, MapPin, Train } from "lucide-react";

/**
 * Hero visual: floating "product shots" built from real UI primitives (no stock art),
 * the way modern product sites show the app itself.
 */
export function ProductCollage() {
  return (
    <div aria-hidden className="pointer-events-none relative mx-auto mt-16 hidden h-[420px] max-w-6xl select-none md:block">
      {/* listing card */}
      <div className="absolute left-[4%] top-6 w-[290px] -rotate-[4deg] rounded-3xl border border-line bg-elev p-3 shadow-2xl animate-fade-up">
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/homes/home-26.jpg" alt="" className="aspect-[4/3] w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-white">Within budget</span>
          <Heart className="absolute right-3 top-3 h-5 w-5 fill-[#ff385c] text-[#ff385c]" />
        </div>
        <div className="px-1 pt-3">
          <div className="flex justify-between text-sm font-semibold"><span>Zürich, ZH</span><span className="text-muted font-normal">Shared room</span></div>
          <div className="text-xs text-subtle">Seefeldstrasse · 1 spot left</div>
          <div className="mt-1 text-sm"><b>CHF 840</b> <span className="text-muted">/ month</span></div>
        </div>
      </div>

      {/* roommate match */}
      <div className="absolute left-[31%] top-[58%] w-[300px] rotate-[2deg] rounded-3xl border border-line bg-elev p-4 shadow-2xl animate-fade-up [animation-delay:120ms]">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-sm font-bold text-white">PN</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Priya · PhD, UZH</div>
            <div className="text-xs text-subtle">Moves in 3 Sep · early riser</div>
          </div>
          <div className="relative grid h-12 w-12 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line-strong)" strokeWidth="3" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--success)" strokeWidth="3" strokeDasharray="97.4" strokeDashoffset="9" strokeLinecap="round" /></svg>
            <span className="text-xs font-bold">91%</span>
          </div>
        </div>
      </div>

      {/* checklist */}
      <div className="absolute right-[26%] top-0 w-[280px] rotate-[3deg] rounded-3xl border border-line bg-elev p-4 shadow-2xl animate-fade-up [animation-delay:200ms]">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold"><span>First week in Zürich</span><span className="text-accent">3/6</span></div>
        {["Register with the commune", "Choose health insurance", "Get a Swiss SIM"].map((t, i) => (
          <div key={t} className="flex items-center gap-2.5 py-1.5 text-[13px]">
            <span className={`grid h-5 w-5 place-items-center rounded-md ${i < 2 ? "bg-accent-strong text-white" : "border border-line-strong"}`}>{i < 2 && <Check className="h-3.5 w-3.5" />}</span>
            <span className={i < 2 ? "text-subtle line-through" : ""}>{t}</span>
          </div>
        ))}
        <div className="mt-2 h-1.5 rounded-full bg-hover"><div className="h-full w-1/2 rounded-full bg-accent-strong" /></div>
      </div>

      {/* live train */}
      <div className="absolute right-[3%] top-[38%] w-[270px] -rotate-[3deg] rounded-3xl border border-line bg-elev p-4 shadow-2xl animate-fade-up [animation-delay:280ms]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Live</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger/15 text-danger"><Train className="h-5 w-5" /></span>
          <div className="flex-1 text-sm">
            <div className="font-semibold">Zürich HB → Bern</div>
            <div className="text-xs text-subtle">IC 8 · 56 min · direct</div>
          </div>
          <span className="text-sm font-bold tabular-nums">07:02</span>
        </div>
      </div>

      {/* essentials pins */}
      <div className="absolute bottom-0 right-[40%] flex items-center gap-2 rounded-full border border-line bg-elev px-4 py-2.5 text-[13px] shadow-2xl animate-fade-up [animation-delay:340ms]">
        <MapPin className="h-4 w-4 text-warm" /> 3 pharmacies · 12 tram stops within 1 km <BadgeCheck className="h-4 w-4 text-accent" />
      </div>
    </div>
  );
}
