"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip, Field, Input, Segmented, Select, Switch, Textarea } from "@/components/ui/field";
import { LocationPicker, type LocationValue } from "@/components/location-picker";
import { HomeCountryPicker } from "@/components/home-country-picker";
import { api } from "@/lib/client";

export type ProfileData = {
  name: string;
  occupation: "STUDENT" | "PROFESSIONAL" | "OTHER";
  organization: string;
  homeCountryId: number | null;
  destinationCityId: number | null;
  budgetMonthly: string;
  budgetCurrency: string;
  moveInDate: string;
  bio: string;
  gender: "FEMALE" | "MALE" | "NON_BINARY" | "UNDISCLOSED";
  smoking: "NON_SMOKER" | "OUTSIDE_ONLY" | "SMOKER";
  hasPets: boolean;
  okWithPets: boolean;
  socialStyle: "QUIET" | "BALANCED" | "SOCIAL";
  sleepSchedule: "EARLY_BIRD" | "FLEXIBLE" | "NIGHT_OWL";
  roommateGender: "ANYONE" | "FEMALE_ONLY" | "MALE_ONLY";
  languages: string[];
};

export const EMPTY_PROFILE: ProfileData = {
  name: "", occupation: "STUDENT", organization: "", homeCountryId: null, destinationCityId: null, budgetMonthly: "", budgetCurrency: "", moveInDate: "", bio: "",
  gender: "UNDISCLOSED", smoking: "NON_SMOKER", hasPets: false, okWithPets: true, socialStyle: "BALANCED", sleepSchedule: "FLEXIBLE", roommateGender: "ANYONE", languages: [],
};

const LANGS = [["en", "English"], ["de", "German"], ["fr", "French"], ["it", "Italian"], ["es", "Spanish"], ["pt", "Portuguese"], ["hi", "Hindi"], ["kn", "Kannada"], ["ta", "Tamil"], ["te", "Telugu"], ["zh", "Chinese"], ["ja", "Japanese"], ["ar", "Arabic"], ["tr", "Turkish"]] as const;

/** Sections of the relocation profile; `steps` lets onboarding show one section at a time. */
export function ProfileForm({ initial, onSaved, step, submitLabel = "Save profile" }: { initial: ProfileData; onSaved?: (saved: ProfileData) => void; step?: 0 | 1 | 2; submitLabel?: string }) {
  const [p, setP] = useState<ProfileData>(initial);
  const [loc, setLoc] = useState<LocationValue | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) => setP((s) => ({ ...s, [k]: v }));
  const show = (n: 0 | 1 | 2) => step === undefined || step === n;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/profile", {
        method: "PUT",
        json: {
          ...p,
          name: p.name || undefined,
          destinationCityId: loc?.cityId ?? p.destinationCityId,
          budgetMonthly: p.budgetMonthly === "" ? null : Number(p.budgetMonthly),
          budgetCurrency: p.budgetCurrency || null,
          moveInDate: p.moveInDate || null,
        },
      });
      toast.success("Profile saved");
      onSaved?.({ ...p, destinationCityId: loc?.cityId ?? p.destinationCityId });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-8">
      {show(0) && (
        <section className="space-y-5">
          {step === undefined && <h2 className="text-lg font-semibold">About you</h2>}
          {step === undefined && (
            <Field label="Name">{(a) => <Input {...a} value={p.name} onChange={(e) => set("name", e.target.value)} />}</Field>
          )}
          <div>
            <div className="mb-1.5 text-[13px] font-medium text-muted">I am a…</div>
            <Segmented value={p.occupation} onChange={(v) => set("occupation", v)} options={[{ value: "STUDENT", label: "Student" }, { value: "PROFESSIONAL", label: "Professional" }, { value: "OTHER", label: "Other" }]} />
          </div>
          <Field label={p.occupation === "STUDENT" ? "University" : "Employer"} optional>
            {(a) => <Input {...a} value={p.organization} onChange={(e) => set("organization", e.target.value)} placeholder={p.occupation === "STUDENT" ? "ETH Zürich" : "Company name"} />}
          </Field>
          <Field label="Short bio" optional hint="Shown to possible roommates.">
            {(a) => <Textarea {...a} maxLength={600} value={p.bio} onChange={(e) => set("bio", e.target.value)} placeholder="What should future flatmates know about you?" />}
          </Field>
          <div>
            <div className="mb-2 text-[13px] font-medium text-muted">Languages you speak</div>
            <div className="flex flex-wrap gap-2">
              {LANGS.map(([code, label]) => (
                <Chip key={code} active={p.languages.includes(code)} onClick={() => set("languages", p.languages.includes(code) ? p.languages.filter((l) => l !== code) : [...p.languages, code])}>{label}</Chip>
              ))}
            </div>
          </div>
        </section>
      )}

      {show(1) && (
        <section className="space-y-5">
          {step === undefined && <h2 className="text-lg font-semibold">Your move</h2>}
          <HomeCountryPicker value={p.homeCountryId} onChange={(id) => set("homeCountryId", id)} />
          <LocationPicker initialCityId={p.destinationCityId} onChange={setLoc} onCity={(c) => c && !p.budgetCurrency && set("budgetCurrency", c.currency)} labels={{ city: "Destination city" }} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Monthly housing budget">{(a) => <Input {...a} inputMode="decimal" value={p.budgetMonthly} onChange={(e) => set("budgetMonthly", e.target.value.replace(/[^\d.]/g, ""))} placeholder="1000" />}</Field>
            <Field label="Currency">{(a) => <Input {...a} maxLength={3} value={p.budgetCurrency} onChange={(e) => set("budgetCurrency", e.target.value.toUpperCase())} placeholder="CHF" />}</Field>
            <Field label="Planned move-in">{(a) => <Input {...a} type="date" value={p.moveInDate} onChange={(e) => set("moveInDate", e.target.value)} />}</Field>
          </div>
        </section>
      )}

      {show(2) && (
        <section className="space-y-5">
          {step === undefined && <h2 className="text-lg font-semibold">Living together</h2>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gender">
              {(a) => (
                <Select {...a} value={p.gender} onChange={(e) => set("gender", e.target.value as ProfileData["gender"])}>
                  <option value="UNDISCLOSED">Prefer not to say</option><option value="FEMALE">Woman</option><option value="MALE">Man</option><option value="NON_BINARY">Non-binary</option>
                </Select>
              )}
            </Field>
            <Field label="I'd like to live with">
              {(a) => (
                <Select {...a} value={p.roommateGender} onChange={(e) => set("roommateGender", e.target.value as ProfileData["roommateGender"])}>
                  <option value="ANYONE">Anyone</option><option value="FEMALE_ONLY">Women only</option><option value="MALE_ONLY">Men only</option>
                </Select>
              )}
            </Field>
          </div>
          <Pick label="Smoking" value={p.smoking} onChange={(v) => set("smoking", v)} options={[["NON_SMOKER", "Non-smoker"], ["OUTSIDE_ONLY", "Outside only"], ["SMOKER", "Smoker"]]} />
          <Pick label="At home I'm…" value={p.socialStyle} onChange={(v) => set("socialStyle", v)} options={[["QUIET", "Quiet"], ["BALANCED", "Balanced"], ["SOCIAL", "Social"]]} />
          <Pick label="Sleep schedule" value={p.sleepSchedule} onChange={(v) => set("sleepSchedule", v)} options={[["EARLY_BIRD", "Early bird"], ["FLEXIBLE", "Flexible"], ["NIGHT_OWL", "Night owl"]]} />
          <div className="card divide-y divide-line px-4">
            <div className="py-3"><Switch label="I have a pet" checked={p.hasPets} onChange={(v) => set("hasPets", v)} /></div>
            <div className="py-3"><Switch label="I'm fine living with pets" checked={p.okWithPets} onChange={(v) => set("okWithPets", v)} /></div>
          </div>
        </section>
      )}

      <Button type="submit" size="lg" loading={saving} className="w-full sm:w-auto">{submitLabel}</Button>
    </form>
  );
}

function Pick<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-muted">{label}</div>
      <Segmented value={value} onChange={onChange} options={options.map(([v, l]) => ({ value: v, label: l }))} />
    </div>
  );
}
