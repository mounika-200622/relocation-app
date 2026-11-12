import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { loginSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/rate-limit";

class InvalidLogin extends CredentialsSignin {
  code = "invalid_credentials";
}
class Deactivated extends CredentialsSignin {
  code = "account_deactivated";
}
class TooMany extends CredentialsSignin {
  code = "rate_limited";
}

// Hash of a random throwaway string: comparing against it keeps the response time the
// same whether or not the email exists (no account enumeration by timing).
const DUMMY_HASH = "$2b$10$ii8dVFofWLlv.OazJOXWoeR.Py8IOBcFK3Ibt942KLHxXc0kvVJhO";

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new InvalidLogin();
        const { email, password } = parsed.data;

        if (!rateLimit(`login:${email}`, 8, 15 * 60_000).ok) throw new TooMany();

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, passwordHash: true, role: true, isActive: true, onboardedAt: true },
        });
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok) throw new InvalidLogin();
        if (!user.isActive) throw new Deactivated();

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          onboarded: user.role !== "USER" || user.onboardedAt !== null,
        };
      },
    }),
  ],
});
