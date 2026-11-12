import { prisma } from "@/lib/prisma";
import { forbidden, notFound, type SessionUser } from "@/lib/api";
import { canManageListing } from "@/lib/authz";

/** Loads a listing and makes sure the user owns it (or is an admin). */
export async function loadManagedListing(id: number, user: SessionUser) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, ownerId: true, status: true, title: true, isShareable: true, capacityMax: true, currentOccupants: true, cityId: true },
  });
  if (!listing) throw notFound("Listing not found.");
  if (!canManageListing(user, listing)) throw forbidden("Only the owner can change this listing.");
  return listing;
}
