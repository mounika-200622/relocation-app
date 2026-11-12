import { prisma } from "@/lib/prisma";
import { num } from "@/lib/format";

const MAX_AGE_MS = 24 * 3_600_000;

/**
 * Exchange rate base→quote, cached in the ExchangeRate table for 24 h.
 * Source: open.er-api.com (free, no key). Returns null if unknown and the API is down.
 */
export async function getRate(base: string, quote: string): Promise<number | null> {
  base = base.toUpperCase();
  quote = quote.toUpperCase();
  if (base === quote) return 1;
  const cached = await prisma.exchangeRate.findUnique({ where: { base_quote: { base, quote } } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < MAX_AGE_MS) return num(cached.rate);

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { result: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) throw new Error("bad response");
    // cache every quote we got back, not just the one asked for
    const now = new Date();
    await prisma.$transaction(
      Object.entries(data.rates)
        .filter(([q, r]) => /^[A-Z]{3}$/.test(q) && r > 0)
        .map(([q, rate]) =>
          prisma.exchangeRate.upsert({ where: { base_quote: { base, quote: q } }, update: { rate, fetchedAt: now }, create: { base, quote: q, rate, fetchedAt: now } }),
        ),
    );
    return data.rates[quote] ?? null;
  } catch {
    return cached ? num(cached.rate) : null; // stale is better than nothing
  }
}
