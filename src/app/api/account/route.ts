import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, enforceRateLimit, json, readJson, requireUser, route } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validators/auth";
import { deleteMessagesOf } from "@/lib/mongo/chat";
import { deleteNotificationsOf } from "@/lib/mongo/notifications";
import { deletePhoto } from "@/lib/storage";

/** Change password (current password required). */
export const PATCH = route(async (req) => {
  const user = await requireUser();
  enforceRateLimit(`pw:${user.id}`, 5, 15 * 60_000);
  const { currentPassword, newPassword } = await readJson(req, changePasswordSchema);
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await bcrypt.compare(currentPassword, row.passwordHash))) throw badRequest("Your current password is not correct.");
  if (currentPassword === newPassword) throw badRequest("Choose a password you haven't used here before.");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  return json({ ok: true });
});

/**
 * Delete account. Cascade rules (documented in docs/normalization.md):
 *   profile, languages, listings (→ photos, amenities, requests, saves, views), requests,
 *   saves, checklist progress, itineraries (→ items), conversations, blocks, own reports
 *   CASCADE; reports this admin resolved keep the row (resolvedBy SET NULL).
 * MongoDB has no foreign keys, so messages/notifications are removed explicitly.
 */
export const DELETE = route(async (req) => {
  const user = await requireUser();
  const { password } = await readJson(req, z.object({ password: z.string().min(1, "Enter your password to confirm.") }));
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true, role: true } });
  if (!(await bcrypt.compare(password, row.passwordHash))) throw badRequest("That password is not correct.");
  if (row.role === "ADMIN" && (await prisma.user.count({ where: { role: "ADMIN", isActive: true } })) <= 1) {
    throw badRequest("You are the last administrator. Promote someone else first.");
  }
  const [convos, photos] = await Promise.all([
    prisma.conversation.findMany({ where: { OR: [{ userAId: user.id }, { userBId: user.id }] }, select: { id: true } }),
    prisma.listingPhoto.findMany({ where: { listing: { ownerId: user.id } }, select: { storageKey: true } }),
  ]);
  await prisma.user.delete({ where: { id: user.id } });
  await Promise.all([
    deleteMessagesOf(convos.map((c) => c.id)).catch(() => 0),
    deleteNotificationsOf(user.id).catch(() => undefined),
    ...photos.map((p) => deletePhoto(p.storageKey)),
  ]);
  return json({ ok: true });
});
