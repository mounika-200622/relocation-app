"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { api } from "@/lib/client";

export function BusinessProfileForm({ initial, verified }: { initial: { displayName: string; description: string }; verified: boolean }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="card space-y-5 p-6 md:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api("/api/profile", { method: "PUT", json: { displayName: f.displayName, description: f.description || null } });
          toast.success("Business profile saved");
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className={`flex items-center gap-2 text-sm ${verified ? "text-accent" : "text-subtle"}`}>
        <BadgeCheck className="h-4 w-4" /> {verified ? "Verified business" : "Not verified yet — our team verifies businesses after a check."}
      </div>
      <Field label="Display name">{(a) => <Input {...a} value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} />}</Field>
      <Field label="About your business" optional>{(a) => <Textarea {...a} maxLength={1000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
      <Button type="submit" loading={busy}>Save</Button>
    </form>
  );
}
