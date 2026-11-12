import { z } from "zod";
import { enforceRateLimit, json, readQuery, requireUser, route } from "@/lib/api";
import { geocode } from "@/lib/geocode";

const query = z.object({ q: z.string().trim().min(3).max(200), country: z.string().length(2).optional() });

/** Address → coordinates for the listing form (Nominatim, 1 req/s, cached). */
export const GET = route(async (req) => {
  const user = await requireUser(["BUSINESS", "ADMIN"]);
  enforceRateLimit(`geocode:${user.id}`, 30, 60_000);
  const { q, country } = readQuery(req, query);
  try {
    const hit = await geocode(q, country);
    return json(hit ?? { error: "We couldn't find that address. Drag the pin to set it manually." }, hit ? 200 : 404);
  } catch {
    return json({ error: "The map service is busy. Set the pin manually or try again." }, 503);
  }
});
