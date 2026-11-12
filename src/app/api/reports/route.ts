import { prisma } from "@/lib/prisma";
import { badRequest, enforceRateLimit, json, readJson, requireUser, route } from "@/lib/api";
import { reportSchema } from "@/lib/validators/social";

/** Anyone logged in can report a user or a listing; admins review them in /admin/reports. */
export const POST = route(async (req) => {
  const user = await requireUser();
  enforceRateLimit(`report:${user.id}`, 10, 60 * 60_000);
  const input = await readJson(req, reportSchema);
  if (input.reportedUserId === user.id) throw badRequest("You can't report yourself.");
  const report = await prisma.report.create({
    data: { reporterId: user.id, reportedUserId: input.reportedUserId ?? null, listingId: input.listingId ?? null, reason: input.reason, details: input.details ?? null },
    select: { id: true },
  });
  return json(report, 201);
});
