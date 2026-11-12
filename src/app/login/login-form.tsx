"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { homeFor, safeCallbackUrl } from "@/lib/authz";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don't match. Check for typos and try again.",
  account_deactivated: "This account has been deactivated. Contact support if you think this is a mistake.",
  rate_limited: "Too many attempts. Please wait a few minutes before trying again.",
};

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      setError(MESSAGES[res?.code ?? ""] ?? MESSAGES.invalid_credentials!);
      setLoading(false);
      return;
    }
    const session = await getSession();
    const target = safeCallbackUrl(params.get("callbackUrl"), homeFor(session?.user?.role));
    window.location.assign(target); // full navigation so every server component sees the new session
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
      <Field label="Email">
        {(p) => <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />}
      </Field>
      <Field label="Password">
        {(p) => (
          <div className="relative">
            <Input {...p} type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-subtle hover:text-fg" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        )}
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-muted hover:text-fg">Forgot password?</Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!email || !password}>Log in</Button>
    </form>
  );
}
