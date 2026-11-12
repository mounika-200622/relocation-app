import { prisma } from "@/lib/prisma";
import { badRequest, json, optionalUser, readJson, readQuery, requireUser, route } from "@/lib/api";
import { listingCreateSchema, listingSearchSchema } from "@/lib/validators/listing";
import { savedIdsFor, searchListings } from "@/lib/listings";

/** Public, paginated search. Anyone can browse; saved flags are added for logged-in users. */
export const GET = route(async (req) => {
  const filters = readQuery(req, listingSearchSchema);
  const user = await optionalUser();
  const result = await searchListings(filters);
  const saved = await savedIdsFor(user?.id, result.items.map((i) => i.id));
  return json({ ...result, items: result.items.map((i) => ({ ...i, saved: saved.has(i.id) })) });
});

/** BUSINESS creates a listing (status ACTIVE). Photos are uploaded separately. */
export const POST = route(async (req) => {
  const user = await requireUser(["BUSINESS"]);
  const input = await readJson(req, listingCreateSchema);

  const city = await prisma.city.findUnique({ where: { id: input.cityId }, select: { id: true } });
  if (!city) throw badRequest("Choose a city from the list.");

  const { amenityIds, availableFrom, ...data } = input;
  const listing = await prisma.listing.create({
    data: {
      ...data,
      ownerId: user.id,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      amenities: { create: amenityIds.map((amenityId) => ({ amenityId })) },
    },
    select: { id: true },
  });
  return json(listing, 201);
});
