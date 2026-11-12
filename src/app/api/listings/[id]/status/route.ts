import { prisma } from "@/lib/prisma";
import { forbidden, json, notFound, parseId, readJson, requireUser, route } from "@/lib/api";
import { loadManagedListing } from "@/lib/listing-access";
import { statusChangeSchema } from "@/lib/validators/listing";
import { notify } from "@/lib/mongo/notifications";

type Ctx = { id: string };

/**
 * ACTIVE / ARCHIVED are plain updates. RENTED goes through the stored procedure
 * sp_mark_listing_rented, which locks the row (SELECT … FOR UPDATE), checks ownership,
 * sets the status and closes every OPEN roommate request in one transaction.
 */
export const POST = route<Ctx>(async (req, { params }) => {
  const id = parseId((await params).id);
  const user = await requireUser(["BUSINESS", "ADMIN"]);
  const listing = await loadManagedListing(id, user);
  const { status } = await readJson(req, statusChangeSchema);

  if (status !== "RENTED") {
    await prisma.listing.update({ where: { id }, data: { status } });
    return json({ status });
  }

  const open = await prisma.roommateRequest.findMany({ where: { listingId: id, status: "OPEN" }, select: { requesterId: true } });
  try {
    // ownerId is passed as the listing's real owner when an admin acts on it
    await prisma.$executeRaw`CALL sp_mark_listing_rented(${id}, ${listing.ownerId}, @closed)`;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("NOT_OWNER")) throw forbidden("Only the owner can change this listing.");
    if (msg.includes("LISTING_NOT_FOUND")) throw notFound("Listing not found.");
    throw err;
  }
  await Promise.all(
    open.map((r) =>
      notify(r.requesterId, { type: "LISTING_RENTED", title: "A place you asked about was rented", body: listing.title, link: `/listings/${id}` }),
    ),
  );
  return json({ status: "RENTED", closedRequests: open.length });
});
