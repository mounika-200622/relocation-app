import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError, notFound } from "@/lib/api";
import { computeCompatibility, DEFAULT_PROFILE, type MatchProfile } from "@/lib/matching";
import { num } from "@/lib/format";
import { notify } from "@/lib/mongo/notifications";
import { decideAccept } from "@/lib/roommate-rules";

export { decideAccept } from "@/lib/roommate-rules";
export type { AcceptDecision, ListingState, RequestState } from "@/lib/roommate-rules";


/**
 * Accept inside one transaction:
 *   1. lock the listing row (SELECT … FOR UPDATE) – concurrent accepts queue up here;
 *   2. decide with the locked values;
 *   3. mark the request MATCHED, then increment occupants with a conditional UPDATE
 *      (… WHERE currentOccupants < capacityMax) as a second guard;
 *   4. if the place is now full, close every other OPEN request
 *      (trigger trg_listing_occupancy_bu flips the listing to RENTED).
 */
export async function acceptRequest(requestId: number, actorId: number) {
  const result = await prisma.$transaction(async (tx) => {
    const req = await tx.roommateRequest.findUnique({ where: { id: requestId }, select: { id: true, listingId: true, requesterId: true, status: true } });
    if (!req) throw notFound("Request not found.");
    const [l] = await tx.$queryRaw<{ ownerId: number; status: string; isShareable: number; capacityMax: number; currentOccupants: number; title: string }[]>`
      SELECT ownerId, status, isShareable, capacityMax, currentOccupants, title FROM Listing WHERE id = ${req.listingId} FOR UPDATE`;
    if (!l) throw notFound("Listing not found.");
    const [locked] = await tx.$queryRaw<{ status: string }[]>`SELECT status FROM RoommateRequest WHERE id = ${requestId} FOR UPDATE`;

    const d = decideAccept(actorId, { ...l, isShareable: Boolean(l.isShareable) }, { status: locked?.status ?? req.status, requesterId: req.requesterId });
    if (!d.ok) throw new HttpError(d.status, d.message);

    await tx.roommateRequest.update({ where: { id: requestId }, data: { status: "MATCHED", decidedAt: new Date() } });
    const changed = await tx.$executeRaw`UPDATE Listing SET currentOccupants = currentOccupants + 1 WHERE id = ${req.listingId} AND currentOccupants < capacityMax`;
    if (changed !== 1) throw new HttpError(409, "This place just became full.");

    let closed: number[] = [];
    if (d.becomesFull) {
      const others = await tx.roommateRequest.findMany({ where: { listingId: req.listingId, status: "OPEN" }, select: { id: true, requesterId: true } });
      await tx.roommateRequest.updateMany({ where: { id: { in: others.map((o) => o.id) } }, data: { status: "CLOSED", decidedAt: new Date() } });
      closed = others.map((o) => o.requesterId);
    }
    return { listingId: req.listingId, requesterId: req.requesterId, title: l.title, becomesFull: d.becomesFull, closed };
  });

  await notify(result.requesterId, { type: "REQUEST_ACCEPTED", title: "You've been accepted! 🎉", body: `Your roommate request for "${result.title}" was accepted.`, link: `/listings/${result.listingId}` });
  await Promise.all(result.closed.map((uid) => notify(uid, { type: "REQUEST_DECLINED", title: "A place you asked about is now full", body: result.title, link: `/listings/${result.listingId}` })));
  return result;
}

// ───────────────────────── profiles → matching input ─────────────────────────

type ProfileRow = {
  destinationCityId: number | null; budgetMonthly: Prisma.Decimal | null; moveInDate: Date | null; gender: MatchProfile["gender"] | "UNDISCLOSED";
  roommateGender: MatchProfile["roommateGender"]; smoking: MatchProfile["smoking"]; hasPets: boolean; okWithPets: boolean;
  socialStyle: MatchProfile["social"]; sleepSchedule: MatchProfile["sleep"];
} | null;

export function toMatchProfile(p: ProfileRow): MatchProfile {
  if (!p) return DEFAULT_PROFILE;
  return {
    cityId: p.destinationCityId, budget: num(p.budgetMonthly), moveIn: p.moveInDate, gender: p.gender, roommateGender: p.roommateGender,
    smoking: p.smoking, hasPets: p.hasPets, okWithPets: p.okWithPets, social: p.socialStyle, sleep: p.sleepSchedule,
  };
}

export const profileSelect = {
  destinationCityId: true, budgetMonthly: true, budgetCurrency: true, moveInDate: true, gender: true, roommateGender: true, smoking: true,
  hasPets: true, okWithPets: true, socialStyle: true, sleepSchedule: true, occupation: true, organization: true, bio: true,
} satisfies Prisma.UserProfileSelect;

/** Open (and, for the owner, all) requests on a listing with a compatibility score for the viewer. */
export async function requestsForListing(listingId: number, viewerId: number | null, opts: { includeClosed?: boolean } = {}) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { cityId: true, genderPreference: true, currency: true } });
  if (!listing) return [];
  const [rows, viewer] = await Promise.all([
    prisma.roommateRequest.findMany({
      where: { listingId, ...(opts.includeClosed ? {} : { status: "OPEN" }) },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, message: true, moveInDate: true, budgetShare: true, createdAt: true,
        requester: { select: { id: true, name: true, profile: { select: profileSelect } } },
      },
    }),
    viewerId ? prisma.userProfile.findUnique({ where: { userId: viewerId }, select: profileSelect }) : null,
  ]);
  const vp = viewer ? toMatchProfile(viewer) : null;
  return rows.map((r) => {
    const score = vp && r.requester.id !== viewerId
      ? computeCompatibility(vp, toMatchProfile(r.requester.profile), listing, { otherBudget: num(r.budgetShare), otherMoveIn: r.moveInDate }).total
      : null;
    return {
      id: r.id, status: r.status, message: r.message, createdAt: r.createdAt.toISOString(),
      moveInDate: r.moveInDate ? r.moveInDate.toISOString().slice(0, 10) : null,
      budgetShare: num(r.budgetShare), currency: listing.currency,
      requester: { id: r.requester.id, name: r.requester.name, occupation: r.requester.profile?.occupation ?? "OTHER", organization: r.requester.profile?.organization ?? null },
      score, isMine: r.requester.id === viewerId,
    };
  });
}

/** "Top matches for you" straight from the SQL view v_roommate_compatibility. */
export async function topMatches(viewerId: number, limit = 6) {
  const rows = await prisma.$queryRaw<{ requestId: number; requesterId: number; listingId: number; score: Prisma.Decimal; name: string; occupation: string | null; title: string; message: string; moveInDate: Date | null }[]>`
    SELECT c.requestId, c.requesterId, c.listingId, c.score, u.name, p.occupation, l.title, rr.message, rr.moveInDate
    FROM v_roommate_compatibility c
    JOIN User u ON u.id = c.requesterId
    LEFT JOIN UserProfile p ON p.userId = c.requesterId
    JOIN Listing l ON l.id = c.listingId
    JOIN RoommateRequest rr ON rr.id = c.requestId
    WHERE c.viewerId = ${viewerId}
      AND NOT EXISTS (SELECT 1 FROM Block b WHERE (b.blockerId = ${viewerId} AND b.blockedId = c.requesterId) OR (b.blockerId = c.requesterId AND b.blockedId = ${viewerId}))
    ORDER BY c.score DESC, rr.createdAt DESC
    LIMIT ${limit}`;
  return rows.map((r) => ({
    requestId: r.requestId, requesterId: r.requesterId, listingId: r.listingId, score: Number(r.score), name: r.name,
    occupation: r.occupation ?? "OTHER", listingTitle: r.title, message: r.message, moveInDate: r.moveInDate ? r.moveInDate.toISOString().slice(0, 10) : null,
  }));
}
