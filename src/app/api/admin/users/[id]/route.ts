import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, parseId, readJson, requireUser, route } from "@/lib/api";

type Ctx = { id: string };
const body = z.object({ isActive: z.boolean().optional(), verified: z.boolean().optional(), role: z.enum(["USER", "BUSINESS", "ADMIN"]).optional() });

/** ADMIN: deactivate/reactivate a user, verify a business, change a role. */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireUser(["ADMIN"]);
  const id = parseId((await params).id, "user id");
  const input = await readJson(req, body);
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, name: true } });
  if (!user) throw notFound("User not found.");
  if (id === admin.id && (input.isActive === false || (input.role && input.role !== "ADMIN"))) throw badRequest("You can't deactivate or demote yourself.");

  await prisma.$transaction(async (tx) => {
    if (input.isActive !== undefined || input.role) await tx.user.update({ where: { id }, data: { ...(input.isActive !== undefined ? { isActive: input.isActive } : {}), ...(input.role ? { role: input.role } : {}) } });
    if (input.verified !== undefined) {
      if (user.role !== "BUSINESS") throw badRequest("Only business accounts can be verified.");
      await tx.businessProfile.upsert({
        where: { userId: id },
        update: { isVerified: input.verified, verifiedAt: input.verified ? new Date() : null },
        create: { userId: id, displayName: user.name, isVerified: input.verified, verifiedAt: input.verified ? new Date() : null },
      });
    }
  });
  return json({ ok: true });
});
