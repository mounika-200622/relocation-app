"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function RoommateFilters({ initial }: { initial: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(initial);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v || undefined }));
  const apply = () => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
    router.push(`${pathname}?${qs}`);
  };
  return (
    <div className="card grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-7 lg:items-end">
      <Input aria-label="Min budget" placeholder="Min budget" inputMode="numeric" value={f.minBudget ?? ""} onChange={(e) => set("minBudget", e.target.value.replace(/\D/g, ""))} />
      <Input aria-label="Max budget" placeholder="Max budget" inputMode="numeric" value={f.maxBudget ?? ""} onChange={(e) => set("maxBudget", e.target.value.replace(/\D/g, ""))} />
      <Input aria-label="Moving in from" type="date" value={f.moveInFrom ?? ""} onChange={(e) => set("moveInFrom", e.target.value)} />
      <Input aria-label="Moving in until" type="date" value={f.moveInTo ?? ""} onChange={(e) => set("moveInTo", e.target.value)} />
      <Select aria-label="Gender" value={f.gender ?? ""} onChange={(e) => set("gender", e.target.value)}>
        <option value="">Any gender</option><option value="FEMALE">Women</option><option value="MALE">Men</option><option value="NON_BINARY">Non-binary</option>
      </Select>
      <Select aria-label="Smoking" value={f.smoking ?? ""} onChange={(e) => set("smoking", e.target.value)}>
        <option value="">Smoking: any</option><option value="NON_SMOKER">Non-smokers</option><option value="OUTSIDE_ONLY">Outside only</option><option value="SMOKER">Smokers</option>
      </Select>
      <div className="flex gap-2">
        <Select aria-label="Pets" value={f.pets ?? ""} onChange={(e) => set("pets", e.target.value)}>
          <option value="">Pets: any</option><option value="no">No pets</option><option value="yes">Has pets</option>
        </Select>
        <Button onClick={apply}>Apply</Button>
      </div>
    </div>
  );
}
