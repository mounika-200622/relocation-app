"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { formatMoney, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Two-way converter between the person's home currency and the local one, at today's rate. */
export function CurrencyConverter({ home, local, className, compact }: { home: string; local: string; className?: string; compact?: boolean }) {
  const [rate, setRate] = useState<{ rate: number; asOf: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [fromHome, setFromHome] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/fx?from=${home}&to=${local}`)
      .then(async (r) => {
        const d = await r.json();
        if (!alive) return;
        if (r.ok) setRate({ rate: d.rate, asOf: d.asOf });
        else setError(d.error ?? "Rate unavailable");
      })
      .catch(() => alive && setError("Rate unavailable offline"));
    return () => {
      alive = false;
    };
  }, [home, local]);

  const n = Number(amount) || 0;
  const [src, dst] = fromHome ? [home, local] : [local, home];
  const result = rate ? (fromHome ? n * rate.rate : n / rate.rate) : null;

  return (
    <div className={cn("rounded-2xl border border-line bg-soft p-4", className)}>
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-semibold uppercase tracking-wider">Live exchange rate</span>
        {rate && <span>updated {relativeTime(rate.asOf)}</span>}
      </div>
      {error ? (
        <p className="mt-2 text-sm text-warning">{error}</p>
      ) : !rate ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-subtle"><Loader2 className="h-4 w-4 animate-spin" /> Getting today&apos;s rate…</p>
      ) : (
        <>
          <p className={cn("mt-1 font-semibold tabular-nums", compact ? "text-base" : "text-xl")}>
            1 {home} = {rate.rate < 0.01 ? rate.rate.toPrecision(3) : rate.rate.toFixed(rate.rate < 1 ? 4 : 2)} {local}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <label className="flex min-w-0 flex-1 items-center rounded-xl border border-line bg-elev px-3">
              <span className="text-xs font-semibold text-subtle">{src}</span>
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 12))} className="h-10 w-full min-w-0 bg-transparent px-2 text-right tabular-nums outline-none" aria-label={`Amount in ${src}`} />
            </label>
            <button onClick={() => setFromHome((v) => !v)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-elev hover:bg-hover" aria-label="Swap currencies"><ArrowLeftRight className="h-4 w-4" /></button>
            <div className="flex h-10 min-w-0 flex-1 items-center justify-end rounded-xl border border-line bg-elev px-3 font-semibold tabular-nums"><span className="truncate">{result === null ? "—" : formatMoney(result, dst, { decimals: 2 })}</span></div>
          </div>
        </>
      )}
    </div>
  );
}
