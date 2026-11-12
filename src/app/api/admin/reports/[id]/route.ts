import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json, parseId, readJson, requireUser, route } from "@/lib/api";

type Ctx = { id: string };
const body = z.object({ status: z.enum(["REVIEWED", "DISMISSED", "OPEN"]), archiveListing: z.boolean().optional(), deactivateUser: z.boolean().optional() });

/** ADMIN: resolve a report, optionally archiving the listing or deactivating the user in the same transaction. */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireUser(["ADMIN"]);
  const id = parseId((await params).id, "report id");
  const input = await readJson(req, body);
  await prisma.$transaction(async (tx) => {
    const r = await tx.report.update({
      where: { id },
      data: { status: input.status, resolvedById: input.status === "OPEN" ? null : admin.id, resolvedAt: input.status === "OPEN" ? null : new Date() },
      select: { listingId: true, reportedUserId: true },
    });
    if (input.archiveListing && r.listingId) await tx.listing.update({ where: { id: r.listingId }, data: { status: "ARCHIVED" } });
    if (input.deactivateUser && r.reportedUserId && r.reportedUserId !== admin.id) await tx.user.update({ where: { id: r.reportedUserId }, data: { isActive: false } });
  });
  return json({ ok: true });
});
