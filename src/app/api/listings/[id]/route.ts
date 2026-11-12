import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, parseId, readJson, requireUser, route } from "@/lib/api";
import { listingUpdateSchema } from "@/lib/validators/listing";
import { loadManagedListing } from "@/lib/listing-access";
import { deletePhoto } from "@/lib/storage";
import { num } from "@/lib/format";

type Ctx = { id: string };

/** Full listing for the edit form (owner/admin only – public pages read the DB directly). */
export const GET = route<Ctx>(async (_req, { params }) => {
  const id = parseId((await params).id);
  const user = await requireUser(["BUSINESS", "ADMIN"]);
  await loadManagedListing(id, user);
  const l = await prisma.listing.findUnique({
    where: { id },
    include: { photos: { orderBy: [{ position: "asc" }, { id: "asc" }] }, amenities: { select: { amenityId: true } } },
  });
  if (!l) throw notFound();
  const { legacyPhotos: _legacy, ...rest } = l;
  return json({
    ...rest,
    price: num(l.price),
    deposit: num(l.deposit),
    billsEstimate: num(l.billsEstimate),
    availableFrom: l.availableFrom ? l.availableFrom.toISOString().slice(0, 10) : null,
    amenityIds: l.amenities.map((a) => a.amenityId),
  });
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const id = parseId((await params).id);
  const user = await requireUser(["BUSINESS", "ADMIN"]);
  const current = await loadManagedListing(id, user);
  const input = await readJson(req, listingUpdateSchema);

  // capacity rules can involve fields that are not in this patch
  const capMax = input.capacityMax ?? current.capacityMax;
  const occupants = input.currentOccupants ?? current.currentOccupants;
  if (occupants > capMax) throw badRequest("Current occupants can't exceed the maximum capacity.");

  const { amenityIds, availableFrom, ...data } = input;
  await prisma.$transaction(async (tx) => {
    await tx.listing.update({
      where: { id },
      data: { ...data, ...(availableFrom !== undefined ? { availableFrom: availableFrom ? new Date(availableFrom) : null } : {}) },
    });
    if (amenityIds) {
      await tx.listingAmenity.deleteMany({ where: { listingId: id } });
      if (amenityIds.length) await tx.listingAmenity.createMany({ data: amenityIds.map((amenityId) => ({ listingId: id, amenityId })) });
    }
  });
  return json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const id = parseId((await params).id);
  const user = await requireUser(["BUSINESS", "ADMIN"]);
  await loadManagedListing(id, user);
  const photos = await prisma.listingPhoto.findMany({ where: { listingId: id }, select: { storageKey: true } });
  // FK rules: photos, amenities, saves, views and requests CASCADE; conversations are
  // kept (listingId SET NULL) so people can still finish their chat.
  await prisma.listing.delete({ where: { id } });
  await Promise.all(photos.map((p) => deletePhoto(p.storageKey)));
  return json({ ok: true });
});
