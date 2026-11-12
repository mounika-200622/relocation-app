import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, json, optionalUser, readQuery, route } from "@/lib/api";
import { ESSENTIAL_GROUPS, type EssentialGroup } from "@/lib/poi/categories";
import { nearby } from "@/lib/poi/service";
import { lat, lng, optionalId } from "@/lib/validators/common";

const query = z.object({
  lat,
  lng,
  radius: z.coerce.number().int().min(500).max(5000).default(1500),
  group: z.enum(Object.keys(ESSENTIAL_GROUPS) as [EssentialGroup, ...EssentialGroup[]]).default("food"),
  cityId: optionalId,
  maxPrice: z.coerce.number().positive().optional().catch(undefined),
});

/** Nearby essentials around a point (live OSM data, cached in MySQL for 7 days). */
export const GET = route(async (req) => {
  const user = await optionalUser();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  enforceRateLimit(`poi:${user?.id ?? ip}`, 60, 60_000);
  const q = readQuery(req, query);
  const city = q.cityId ? await prisma.city.findUnique({ where: { id: q.cityId }, select: { id: true, countryId: true } }) : null;

  const result = await nearby({
    center: { lat: q.lat, lng: q.lng },
    radiusM: q.radius,
    categories: [...ESSENTIAL_GROUPS[q.group].categories],
    cityId: city?.id ?? null,
    countryId: city?.countryId ?? null,
  });
  const items = q.maxPrice !== undefined ? result.items.filter((i) => !i.price || i.price.mid <= q.maxPrice!) : result.items;
  return json({ items, stale: result.stale, radius: q.radius });
});
