/** Pure roommate rules (no framework imports) so they can be unit-tested. */
export type ListingState = { ownerId: number; status: string; isShareable: boolean; capacityMax: number; currentOccupants: number };
export type RequestState = { status: string; requesterId: number };
export type AcceptDecision =
  | { ok: true; becomesFull: boolean }
  | { ok: false; status: 403 | 409; message: string };

/**
 * The rules for an owner accepting a roommate request. The DB transaction calls this
 * with rows it has locked, so the answer cannot change before the update runs.
 */
export function decideAccept(actorId: number, listing: ListingState, request: RequestState): AcceptDecision {
  if (listing.ownerId !== actorId) return { ok: false, status: 403, message: "Only the owner can accept requests for this place." };
  if (request.status !== "OPEN") return { ok: false, status: 409, message: "This request is no longer open." };
  if (!listing.isShareable) return { ok: false, status: 409, message: "This place isn't set up for sharing." };
  if (listing.status !== "ACTIVE") return { ok: false, status: 409, message: "This place is not active any more." };
  if (listing.currentOccupants >= listing.capacityMax) return { ok: false, status: 409, message: "This place is already full." };
  return { ok: true, becomesFull: listing.currentOccupants + 1 >= listing.capacityMax };
}

