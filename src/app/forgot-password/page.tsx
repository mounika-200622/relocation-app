"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one." footer={<Link href="/login" className="hover:text-fg">Back to log in</Link>}>
      {done ? (
        <div className="card flex flex-col items-center p-8 text-center">
          <MailCheck className="h-10 w-10 text-success" />
          <p className="mt-4 text-sm text-muted">If an account exists for <b className="text-fg">{email}</b>, a reset link is on its way. It works for one hour.</p>
          <p className="mt-2 text-xs text-subtle">Running locally? The link is printed in the server console.</p>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              await api("/api/auth/password-reset", { method: "POST", json: { email } });
              setDone(true);
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setLoading(false);
            }
          }}
        >
          <Field label="Email" error={error}>
            {(p) => <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!email}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
