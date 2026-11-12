import { prisma } from "@/lib/prisma";
import { HttpError, badRequest, conflict, enforceRateLimit, json, notFound, optionalUser, parseId, readJson, requireUser, route } from "@/lib/api";
import { requestsForListing } from "@/lib/roommates";
import { roommateRequestSchema } from "@/lib/validators/social";
import { notify } from "@/lib/mongo/notifications";
import { Prisma } from "@prisma/client";

type Ctx = { id: string };

/** Public list of open requests (with compatibility for the viewer); the owner also sees closed ones. */
export const GET = route<Ctx>(async (_req, { params }) => {
  const listingId = parseId((await params).id);
  const user = await optionalUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { ownerId: true } });
  if (!listing) throw notFound("Listing not found.");
  const isOwner = user?.id === listing.ownerId || user?.role === "ADMIN";
  return json({ items: await requestsForListing(listingId, user?.id ?? null, { includeClosed: isOwner }), isOwner });
});

/** A USER posts a request to share this place. One OPEN request per user per listing. */
export const POST = route<Ctx>(async (req, { params }) => {
  const listingId = parseId((await params).id);
  const user = await requireUser(["USER"]);
  enforceRateLimit(`rr:${user.id}`, 15, 60 * 60_000);
  const input = await readJson(req, roommateRequestSchema);

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, ownerId: true, title: true, status: true, isShareable: true, capacityMax: true, currentOccupants: true } });
  if (!listing) throw notFound("Listing not found.");
  if (!listing.isShareable) throw badRequest("This place isn't open for sharing.");
  if (listing.status !== "ACTIVE" || listing.currentOccupants >= listing.capacityMax) throw new HttpError(409, "This place has no free spots right now.");

  try {
    const created = await prisma.roommateRequest.create({
      data: { listingId, requesterId: user.id, message: input.message, moveInDate: input.moveInDate ? new Date(input.moveInDate) : null, budgetShare: input.budgetShare ?? null },
      select: { id: true },
    });
    await notify(listing.ownerId, { type: "ROOMMATE_REQUEST", title: "New roommate request", body: `${user.name} wants to share "${listing.title}".`, link: `/business/listings/${listingId}/requests` });
    return json(created, 201);
  } catch (err) {
    // UNIQUE(listingId, openRequesterId) – kept in sync by trigger trg_request_open_bi
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw conflict("You already have an open request for this place.");
    throw err;
  }
});
