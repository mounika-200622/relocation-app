import { prisma } from "@/lib/prisma";
import { HttpError, badRequest, enforceRateLimit, json, notFound, parseId, readJson, requireUser, route } from "@/lib/api";
import { loadManagedListing } from "@/lib/listing-access";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, deletePhoto, savePhoto, sniffImage } from "@/lib/storage";
import { photoUpdateSchema } from "@/lib/validators/listing";

type Ctx = { id: string };

const listPhotos = (listingId: number) =>
  prisma.listingPhoto.findMany({ where: { listingId }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true, url: true, position: true, caption: true } });

/** Upload one or more photos (multipart field "files"). jpg/png/webp, ≤ 5 MB each, ≤ 10 per listing. */
export const POST = route<Ctx>(async (req, { params }) => {
  const listingId = parseId((await params).id);
  const user = await requireUser(["BUSINESS", "ADMIN"]);
  await loadManagedListing(listingId, user);
  enforceRateLimit(`upload:${user.id}`, 40, 10 * 60_000);

  const form = await req.formData().catch(() => {
    throw badRequest("Send the photos as multipart/form-data.");
  });
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) throw badRequest("Choose at least one photo.");

  const existing = await prisma.listingPhoto.count({ where: { listingId } });
  if (existing + files.length > MAX_PHOTOS) throw badRequest(`A listing can have at most ${MAX_PHOTOS} photos (you have ${existing}).`);

  // validate everything before storing anything
  const prepared = await Promise.all(
    files.map(async (f) => {
      if (f.size > MAX_PHOTO_BYTES) throw new HttpError(413, `"${f.name}" is larger than 5 MB.`);
      const buf = Buffer.from(await f.arrayBuffer());
      const kind = sniffImage(buf);
      if (!kind) throw badRequest(`"${f.name}" is not a JPG, PNG or WebP image.`);
      return { buf, kind };
    }),
  );

  let position = existing;
  for (const p of prepared) {
    const stored = await savePhoto(p.buf, p.kind, `listings/${listingId}`);
    await prisma.listingPhoto.create({ data: { listingId, url: stored.url, storageKey: stored.storageKey, position: position++ } });
  }
  return json({ photos: await listPhotos(listingId) }, 201);
});

/** Reorder, choose a cover (moved to position 0) and edit captions. */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const listingId = parseId((await params).id);
  const user = await requireUser(["BUSINESS", "ADMIN"]);
  await loadManagedListing(listingId, user);
  const input = await readJson(req, photoUpdateSchema);

  const photos = await prisma.listingPhoto.findMany({ where: { listingId }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } });
  const ids = new Set(photos.map((p) => p.id));
  let order = input.order ?? photos.map((p) => p.id);
  if (order.length !== ids.size || order.some((id) => !ids.has(id))) throw badRequest("The order must list every photo of this listing exactly once.");
  if (input.coverId) {
    if (!ids.has(input.coverId)) throw notFound("Photo not found.");
    order = [input.coverId, ...order.filter((id) => id !== input.coverId)];
  }
  await prisma.$transaction(
    order.map((id, position) =>
      prisma.listingPhoto.update({ where: { id }, data: { position, ...(input.captions?.[String(id)] !== undefined ? { caption: input.captions[String(id)] || null } : {}) } }),
    ),
  );
  return json({ photos: await listPhotos(listingId) });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  const listingId = parseId((await params).id);
  const photoId = parseId(new URL(req.url).searchParams.get("photoId") ?? undefined, "photo id");
  const user = await requireUser(["BUSINESS", "ADMIN"]);
  await loadManagedListing(listingId, user);
  const photo = await prisma.listingPhoto.findFirst({ where: { id: photoId, listingId }, select: { id: true, storageKey: true } });
  if (!photo) throw notFound("Photo not found.");
  await prisma.listingPhoto.delete({ where: { id: photo.id } });
  await deletePhoto(photo.storageKey);
  // close the gap so positions stay 0..n-1
  const rest = await prisma.listingPhoto.findMany({ where: { listingId }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } });
  await prisma.$transaction(rest.map((p, position) => prisma.listingPhoto.update({ where: { id: p.id }, data: { position } })));
  return json({ photos: await listPhotos(listingId) });
});
