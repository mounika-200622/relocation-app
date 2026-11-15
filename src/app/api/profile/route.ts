import { prisma } from "@/lib/prisma";
import { json, readJson, requireUser, route } from "@/lib/api";
import { businessProfileSchema, userProfileSchema } from "@/lib/validators/profile";
import { num } from "@/lib/format";
import { locateOrganization } from "@/lib/destination";

export const GET = route(async () => {
  const user = await requireUser();
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, onboardedAt: true, profile: true, businessProfile: true, languages: { select: { languageCode: true } } },
  });
  return json({
    ...u,
    profile: u.profile ? { ...u.profile, budgetMonthly: num(u.profile.budgetMonthly), moveInDate: u.profile.moveInDate?.toISOString().slice(0, 10) ?? null } : null,
    languages: u.languages.map((l) => l.languageCode),
  });
});

/** USER → relocation profile + languages; BUSINESS → public business profile. */
export const PUT = route(async (req) => {
  const user = await requireUser();
  if (user.role === "BUSINESS") {
    const input = await readJson(req, businessProfileSchema);
    await prisma.$transaction([
      ...(input.name ? [prisma.user.update({ where: { id: user.id }, data: { name: input.name } })] : []),
      prisma.businessProfile.upsert({
        where: { userId: user.id },
        update: { displayName: input.displayName, description: input.description ?? null },
        create: { userId: user.id, displayName: input.displayName, description: input.description ?? null },
      }),
    ]);
    return json({ ok: true });
  }

  const { name, languages, moveInDate, ...p } = await readJson(req, userProfileSchema);
  const data = { ...p, organization: p.organization || null, bio: p.bio || null, moveInDate: moveInDate ? new Date(moveInDate) : null };
  const before = await prisma.userProfile.findUnique({ where: { userId: user.id }, select: { organization: true, destinationCityId: true, organizationLat: true } });
  const valid = await prisma.language.findMany({ where: { code: { in: languages } }, select: { code: true } });
  await prisma.$transaction([
    ...(name ? [prisma.user.update({ where: { id: user.id }, data: { name } })] : []),
    prisma.userProfile.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } }),
    prisma.userLanguage.deleteMany({ where: { userId: user.id } }),
    prisma.userLanguage.createMany({ data: valid.map((l) => ({ userId: user.id, languageCode: l.code })) }),
    prisma.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } }),
  ]);

  // Find the university / employer on the map (once, and again when it or the city changes), so the
  // dashboard can show homes and essentials nearest to it. Best effort: a miss leaves it empty.
  const cityId = data.destinationCityId ?? null;
  const changed = data.organization !== (before?.organization ?? null) || cityId !== (before?.destinationCityId ?? null) || before?.organizationLat == null;
  if (changed) {
    const point = data.organization && cityId ? await locateOrganization(data.organization, cityId).catch(() => null) : null;
    await prisma.userProfile.update({ where: { userId: user.id }, data: { organizationLat: point?.lat ?? null, organizationLng: point?.lng ?? null } });
  }
  return json({ ok: true });
});
