import { prisma } from "@/lib/prisma";
import { num, shortName } from "@/lib/format";
import { geocode } from "@/lib/geocode";
import { haversineKm } from "@/lib/geo";
import { briefingForCity } from "@/lib/locate";
import { nearestCards } from "@/lib/listings";

/** A campus or office further than this from the destination city is a wrong geocoding hit. */
const MAX_ORG_DISTANCE_KM = 60;

/**
 * Finds where a university / employer is, near the destination city (OpenStreetMap Nominatim).
 * Returns null when nothing plausible is found – the dashboard then measures from the city centre.
 */
export async function locateOrganization(organization: string, cityId: number) {
  const city = await prisma.city.findUnique({ where: { id: cityId }, select: { name: true, lat: true, lng: true, country: { select: { isoCode: true } } } });
  if (!city || city.lat === null || city.lng === null) return null;
  const centre = { lat: city.lat, lng: city.lng };
  const name = city.name.replace(/\s+City$/i, "");
  for (const query of [`${organization}, ${name}`, organization]) {
    const hit = await geocode(query, city.country.isoCode).catch(() => null);
    if (hit && haversineKm(centre, hit) <= MAX_ORG_DISTANCE_KM) return { lat: hit.lat, lng: hit.lng };
  }
  return null;
}

/**
 * Everything about the place on someone's profile: the country briefing (currency, SIMs,
 * transport, rides, emergency numbers, costs) plus the homes nearest their campus or office.
 */
export async function destinationBriefing(userId: number) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      occupation: true, organization: true, organizationLat: true, organizationLng: true, homeCountryId: true, budgetMonthly: true, budgetCurrency: true,
      destinationCity: { select: { id: true, name: true, lat: true, lng: true, countryId: true, region: { select: { name: true } } } },
    },
  });
  const city = profile?.destinationCity;
  if (!profile || !city || city.lat === null || city.lng === null) return null;

  const campus = profile.organization && profile.organizationLat !== null && profile.organizationLng !== null
    ? { name: profile.organization, lat: profile.organizationLat, lng: profile.organizationLng }
    : null;
  const anchor = campus ?? { lat: city.lat, lng: city.lng };

  const [briefing, homes] = await Promise.all([
    briefingForCity({ id: city.id, name: city.name, lat: city.lat, lng: city.lng, regionName: city.region?.name ?? null, countryId: city.countryId, km: 0 }, anchor, profile.homeCountryId),
    nearestCards(anchor, 6),
  ]);

  return {
    briefing,
    campus,
    organization: profile.organization,
    occupation: profile.occupation,
    /** short label for "x km from …": the campus name, or the city centre */
    anchorLabel: campus ? shortName(campus.name) : `${city.name} centre`,
    homes,
    budget: profile.budgetMonthly ? { amount: num(profile.budgetMonthly)!, currency: profile.budgetCurrency ?? briefing.country.currency } : null,
  };
}

export type DestinationBriefing = NonNullable<Awaited<ReturnType<typeof destinationBriefing>>>;
