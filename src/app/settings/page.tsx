"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/misc";
import { ThemeToggle } from "@/components/theme";
import { api } from "@/lib/client";

export default function SettingsPage() {
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const [confirm, setConfirm] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 pb-16 pt-8">
      <PageHeader title="Settings" />

      <section className="card flex items-center justify-between p-6">
        <div>
          <h2 className="font-semibold">Appearance</h2>
          <p className="text-sm text-muted">Switch between dark and light.</p>
        </div>
        <ThemeToggle className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-soft hover:bg-hover" />
      </section>

      <form
        className="card space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/api/account", { method: "PATCH", json: pw });
            toast.success("Password changed");
            setPw({ currentPassword: "", newPassword: "" });
          } catch (err) {
            toast.error((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-semibold">Change password</h2>
        <Field label="Current password">{(a) => <Input {...a} type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />}</Field>
        <Field label="New password" hint="At least 8 characters.">{(a) => <Input {...a} type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />}</Field>
        <Button type="submit" loading={busy} disabled={!pw.currentPassword || pw.newPassword.length < 8}>Update password</Button>
      </form>

      <section className="card border-danger/30 p-6">
        <h2 className="font-semibold text-danger">Delete account</h2>
        <p className="mt-1 text-sm text-muted">Removes your profile, listings, requests, trips, chats and saved places. This can&apos;t be undone.</p>
        <Button variant="danger" className="mt-4" onClick={() => setDel(true)}>Delete my account</Button>
      </section>

      <Modal open={del} onClose={() => setDel(false)} title="Delete your account?">
        <p className="text-sm text-muted">Enter your password to confirm. Everything you created on Nira will be deleted permanently.</p>
        <div className="mt-4"><Field label="Password">{(a) => <Input {...a} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}</Field></div>
        <Button
          variant="danger"
          className="mt-4 w-full"
          disabled={!confirm}
          onClick={async () => {
            try {
              await api("/api/account", { method: "DELETE", json: { password: confirm } });
              await signOut({ redirect: false });
              window.location.assign("/");
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
        >
          Delete permanently
        </Button>
      </Modal>
    </div>
  );
}
