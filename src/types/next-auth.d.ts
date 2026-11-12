import type { AppRole } from "@/lib/authz";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: { id: number; role: AppRole; onboarded: boolean; name?: string | null; email?: string | null };
  }
  interface User {
    role?: AppRole;
    onboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    role?: AppRole;
    onboarded?: boolean;
  }
}
