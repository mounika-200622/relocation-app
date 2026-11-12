import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { conflict, enforceRateLimit, json, readJson, route } from "@/lib/api";
import { signupSchema } from "@/lib/validators/auth";

/** Creates a USER or BUSINESS account (never ADMIN – the schema rejects it). */
export const POST = route(async (req) => {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  enforceRateLimit(`signup:${ip}`, 10, 60 * 60_000);
  const { name, email, password, role } = await readJson(req, signupSchema);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw conflict("An account with this email already exists. Try logging in instead.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      // businesses get their public profile immediately; people fill theirs in during onboarding
      ...(role === "BUSINESS" ? { onboardedAt: new Date(), businessProfile: { create: { displayName: name } } } : { profile: { create: {} } }),
    },
    select: { id: true, name: true, email: true, role: true },
  });
  return json(user, 201);
});
