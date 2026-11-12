"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) return <p className="text-sm text-danger">This link is missing its token. Request a new one from the <Link className="underline" href="/forgot-password">reset page</Link>.</p>;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (password !== confirm) return setError("The two passwords don't match.");
        setError(null);
        setLoading(true);
        try {
          await api("/api/auth/password-reset", { method: "PUT", json: { token, password } });
          toast.success("Password updated. You can log in now.");
          router.push("/login");
        } catch (err) {
          setError((err as Error).message);
          setLoading(false);
        }
      }}
    >
      <Field label="New password" hint="At least 8 characters.">
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Field>
      <Field label="Repeat new password" error={error}>
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>Save new password</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" footer={<Link href="/login" className="hover:text-fg">Back to log in</Link>}>
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
