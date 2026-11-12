import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { badRequest, enforceRateLimit, json, readJson, route } from "@/lib/api";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validators/auth";
import { sendEmail } from "@/lib/email";

const TTL_MS = 60 * 60_000;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

/** Step 1: request a reset link. Always answers the same so emails can't be probed. */
export const POST = route(async (req) => {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  enforceRateLimit(`forgot:${ip}`, 5, 15 * 60_000);
  const { email } = await readJson(req, forgotPasswordSchema);
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } });
  if (user?.isActive) {
    const token = randomBytes(32).toString("base64url");
    // only the hash is stored, so a database leak can't be used to reset passwords
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + TTL_MS) } });
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await sendEmail(email, "Reset your Nira password", `Someone asked to reset your Nira password.\n\nOpen this link within an hour to choose a new one:\n${base}/reset-password?token=${token}\n\nIf it wasn't you, ignore this email.`);
  }
  return json({ ok: true, message: "If an account exists for that email, a reset link is on its way." });
});

/** Step 2: set a new password with a valid, unused token. */
export const PUT = route(async (req) => {
  const { token, password } = await readJson(req, resetPasswordSchema);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(token) }, select: { id: true, userId: true, expiresAt: true, usedAt: true } });
  if (!row || row.usedAt || row.expiresAt < new Date()) throw badRequest("This reset link is invalid or has expired. Request a new one.");
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    // any other outstanding links stop working too
    prisma.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  return json({ ok: true });
});
