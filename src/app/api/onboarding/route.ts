import { prisma } from "@/lib/prisma";
import { json, requireUser, route } from "@/lib/api";

/** Marks onboarding as done (used by "Skip for now"). */
export const POST = route(async () => {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } });
  return json({ ok: true });
});
