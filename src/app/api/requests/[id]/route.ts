import { prisma } from "@/lib/prisma";
import { HttpError, forbidden, json, notFound, parseId, readJson, requireUser, route } from "@/lib/api";
import { acceptRequest } from "@/lib/roommates";
import { requestActionSchema } from "@/lib/validators/social";
import { notify } from "@/lib/mongo/notifications";

type Ctx = { id: string };

/**
 *   accept   – listing owner; transactional (see acceptRequest)
 *   decline  – listing owner; OPEN → CLOSED
 *   withdraw – requester;     OPEN → WITHDRAWN
 */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const id = parseId((await params).id, "request id");
  const user = await requireUser();
  const { action } = await readJson(req, requestActionSchema);

  if (action === "accept") {
    const r = await acceptRequest(id, user.id);
    return json({ status: "MATCHED", listingFull: r.becomesFull, closedOthers: r.closed.length });
  }

  const request = await prisma.roommateRequest.findUnique({ where: { id }, select: { id: true, status: true, requesterId: true, listing: { select: { id: true, ownerId: true, title: true } } } });
  if (!request) throw notFound("Request not found.");
  if (request.status !== "OPEN") throw new HttpError(409, "This request is no longer open.");

  if (action === "withdraw") {
    if (request.requesterId !== user.id) throw forbidden("Only the person who sent the request can withdraw it.");
    await prisma.roommateRequest.update({ where: { id }, data: { status: "WITHDRAWN", decidedAt: new Date() } });
    return json({ status: "WITHDRAWN" });
  }

  if (request.listing.ownerId !== user.id && user.role !== "ADMIN") throw forbidden("Only the owner can decline requests.");
  await prisma.roommateRequest.update({ where: { id }, data: { status: "CLOSED", decidedAt: new Date() } });
  await notify(request.requesterId, { type: "REQUEST_DECLINED", title: "Request not accepted", body: `Your request for "${request.listing.title}" was declined.`, link: `/listings/${request.listing.id}` });
  return json({ status: "CLOSED" });
});
