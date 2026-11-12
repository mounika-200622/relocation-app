"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/brand";
import { ProfileForm, type ProfileData } from "@/components/profile-form";
import { safeCallbackUrl } from "@/lib/authz";
import { cn } from "@/lib/cn";

const STEPS = [
  { title: "Tell us about you", sub: "This helps us find people you'll get along with." },
  { title: "Where are you headed?", sub: "We'll pre-fill your searches, budget and checklist." },
  { title: "How do you like to live?", sub: "Used for roommate compatibility scores. Change it any time." },
] as const;

export function OnboardingWizard({ initial, name, next }: { initial: ProfileData; name: string; next?: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [data, setData] = useState(initial);
  const { update } = useSession();

  const finish = async (skip = false) => {
    if (skip) await fetch("/api/onboarding", { method: "POST" });
    await update({ onboarded: true }); // refresh the JWT so the proxy stops redirecting here
    window.location.assign(safeCallbackUrl(next && next !== "/onboarding" ? next : null, "/choose-path"));
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-6">
      <div className="flex items-center justify-between">
        <Logo className="text-3xl" />
        <button onClick={() => finish(true)} className="text-sm text-muted hover:text-fg">Skip for now</button>
      </div>
      <div className="mt-10 flex gap-2" aria-label={`Step ${step + 1} of 3`}>
        {STEPS.map((_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition", i <= step ? "bg-accent-strong" : "bg-hover")} />
        ))}
      </div>
      <div className="mt-10 animate-fade-up" key={step}>
        <p className="text-sm text-accent">{step === 0 ? `Hi ${name.split(" ")[0]} 👋` : `Step ${step + 1} of 3`}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{STEPS[step].title}</h1>
        <p className="mt-2 text-muted">{STEPS[step].sub}</p>
        <div className="mt-8">
          <ProfileForm
            key={step}
            initial={data}
            step={step}
            submitLabel={step < 2 ? "Continue" : "Finish"}
            onSaved={(saved) => {
              setData(saved);
              if (step < 2) setStep((s) => (s + 1) as 0 | 1 | 2);
              else finish();
            }}
          />
        </div>
        {step > 0 && (
          <button onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2)} className="mt-4 text-sm text-muted hover:text-fg">← Back</button>
        )}
      </div>
    </div>
  );
}
