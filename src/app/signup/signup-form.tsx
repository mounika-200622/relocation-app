"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Building2, Compass } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { passwordStrength, signupSchema } from "@/lib/validators/auth";
import { cn } from "@/lib/cn";

type Role = "USER" | "BUSINESS";

export function SignupForm() {
  const params = useSearchParams();
  const [role, setRole] = useState<Role>(params.get("role") === "BUSINESS" ? "BUSINESS" : "USER");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(form.password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = signupSchema.safeParse({ ...form, role });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const i of parsed.error.issues) map[String(i.path[0])] ??= i.message;
      setErrors(map);
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    const login = await signIn("credentials", { email: parsed.data.email, password: form.password, redirect: false });
    window.location.assign(login?.error ? "/login" : role === "BUSINESS" ? "/business" : "/onboarding");
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-3">
        {([
          ["USER", "I'm moving or travelling", "Find homes, roommates, plan trips", Compass],
          ["BUSINESS", "I rent out places", "Dorms, flats, rooms, agencies", Building2],
        ] as const).map(([value, title, sub, Icon]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={role === value}
            onClick={() => setRole(value)}
            className={cn("rounded-2xl border p-4 text-left transition", role === value ? "border-accent bg-accent-soft ring-4 ring-accent/10" : "border-line bg-soft hover:border-line-strong")}
          >
            <Icon className={cn("h-5 w-5", role === value ? "text-accent" : "text-subtle")} />
            <div className="mt-3 text-sm font-semibold">{title}</div>
            <div className="mt-0.5 text-xs text-subtle">{sub}</div>
          </button>
        ))}
      </div>

      {error && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

      <Field label={role === "BUSINESS" ? "Business or display name" : "Full name"} error={errors.name}>
        {(p) => <Input {...p} autoComplete={role === "BUSINESS" ? "organization" : "name"} value={form.name} onChange={set("name")} placeholder={role === "BUSINESS" ? "Alpine Student Living" : "Ana Silva"} />}
      </Field>
      <Field label="Email" error={errors.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />}
      </Field>
      <Field label="Password" error={errors.password} hint="At least 8 characters. Longer is stronger.">
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />}
      </Field>
      {form.password && (
        <div className="-mt-2" aria-live="polite">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full transition", i < strength.score ? (strength.score <= 1 ? "bg-danger" : strength.score === 2 ? "bg-warning" : "bg-success") : "bg-hover")} />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-subtle">Strength: {strength.label}</p>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" loading={loading}>Create account</Button>
      <p className="text-center text-xs text-subtle">Your email and phone are never shown to other people — everyone talks through Nira&apos;s chat.</p>
    </form>
  );
}
