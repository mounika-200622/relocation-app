import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, json, readQuery, route } from "@/lib/api";
import { getRate } from "@/lib/fx";
import { currency } from "@/lib/validators/common";

const query = z.object({ from: currency, to: currency });

/** Live exchange rate (cached 24 h in the ExchangeRate table). */
export const GET = route(async (req) => {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  enforceRateLimit(`fx:${ip}`, 60, 60_000);
  const { from, to } = readQuery(req, query);
  const rate = await getRate(from, to);
  if (rate === null) return json({ error: `No exchange rate available for ${from} → ${to} right now.` }, 503);
  const row = from === to ? null : await prisma.exchangeRate.findUnique({ where: { base_quote: { base: from, quote: to } }, select: { fetchedAt: true } });
  return json({ from, to, rate, asOf: (row?.fetchedAt ?? new Date()).toISOString(), source: "open.er-api.com" });
});
