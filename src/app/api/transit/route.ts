import { z } from "zod";
import { headers } from "next/headers";
import { enforceRateLimit, json, readQuery, route } from "@/lib/api";
import { providerForCountry } from "@/lib/transit/provider";

const query = z.object({
  country: z.string().length(2).toUpperCase().default("CH"),
  from: z.string().trim().min(2).max(100).optional(),
  to: z.string().trim().min(2).max(100).optional(),
  stations: z.string().trim().min(2).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().catch(undefined),
  arrival: z.enum(["1", "0"]).optional(),
});

/** Live connections (?from=&to=) or station autocomplete (?stations=) where a provider exists. */
export const GET = route(async (req) => {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  enforceRateLimit(`transit:${ip}`, 40, 60_000);
  const q = readQuery(req, query);
  const provider = await providerForCountry(q.country);
  if (!provider) return json({ error: "Live connections aren't available for this country yet." }, 404);
  try {
    if (q.stations) return json({ stations: await provider.stations(q.stations) });
    if (!q.from || !q.to) return json({ error: "Enter where you start and where you're going." }, 400);
    return json({ provider: provider.name, connections: await provider.connections(q.from, q.to, { date: q.date, time: q.time, arrival: q.arrival === "1" }) });
  } catch {
    return json({ error: "The timetable service isn't answering right now. Please try again in a minute." }, 503);
  }
});
