import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Free for people moving and travelling. Owners list places at no cost." footer={<>Already have an account? <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">Log in</Link></>}>
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
