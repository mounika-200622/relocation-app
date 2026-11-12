import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, json, notFound, optionalUser, readQuery, route } from "@/lib/api";
import { localBriefing } from "@/lib/locate";
import { lat, lng } from "@/lib/validators/common";

const query = z.object({ lat, lng });

/**
 * "Where am I?" – turns the phone's GPS position into the nearest city/country and a
 * briefing of what to do there. The position is not stored.
 */
export const GET = route(async (req) => {
  const user = await optionalUser();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  enforceRateLimit(`locate:${user?.id ?? ip}`, 30, 60_000);
  const q = readQuery(req, query);
  const home = user ? await prisma.userProfile.findUnique({ where: { userId: user.id }, select: { homeCountryId: true } }) : null;
  const briefing = await localBriefing(q.lat, q.lng, home?.homeCountryId ?? null);
  if (!briefing) throw notFound("We couldn't match your position to a city.");
  return json(briefing);
});
