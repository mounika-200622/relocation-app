import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, readQuery, route } from "@/lib/api";
import { optionalId } from "@/lib/validators/common";

const query = z.object({
  level: z.enum(["countries", "regions", "cities", "resolve"]),
  countryId: optionalId,
  regionId: optionalId,
  cityId: optionalId,
  q: z.string().trim().max(80).optional(),
});

const CACHE = { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" };

/**
 * Cascading location lookups for <LocationPicker />:
 *   ?level=countries
 *   ?level=regions&countryId=
 *   ?level=cities&countryId=[&regionId=][&q=]
 *   ?level=resolve&cityId=      → the full country/region/city chain for one city
 */
export const GET = route(async (req) => {
  const p = readQuery(req, query);

  if (p.level === "countries") {
    const rows = await prisma.country.findMany({ select: { id: true, name: true, isoCode: true, flag: true, currency: true }, orderBy: { name: "asc" } });
    return Response.json(rows, { headers: CACHE });
  }
  if (p.level === "regions") {
    if (!p.countryId) return json({ error: "countryId is required." }, 400);
    const rows = await prisma.region.findMany({ where: { countryId: p.countryId }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    return Response.json(rows, { headers: CACHE });
  }
  if (p.level === "cities") {
    if (!p.countryId) return json({ error: "countryId is required." }, 400);
    const rows = await prisma.city.findMany({
      where: { countryId: p.countryId, ...(p.regionId ? { regionId: p.regionId } : {}), ...(p.q ? { name: { startsWith: p.q } } : {}) },
      select: { id: true, name: true, regionId: true, lat: true, lng: true },
      orderBy: { name: "asc" },
      take: 1000,
    });
    return Response.json(rows, { headers: CACHE });
  }
  if (!p.cityId) return json({ error: "cityId is required." }, 400);
  const city = await prisma.city.findUnique({
    where: { id: p.cityId },
    select: { id: true, name: true, lat: true, lng: true, region: { select: { id: true, name: true } }, country: { select: { id: true, name: true, isoCode: true, currency: true, flag: true } } },
  });
  if (!city) return json({ error: "City not found." }, 404);
  return json(city);
});
