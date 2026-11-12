"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client";

export function UserActions({ id, role, active, verified }: { id: number; role: string; active: boolean; verified: boolean }) {
  const router = useRouter();
  const patch = async (json: object, msg: string) => {
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", json });
      toast.success(msg);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="flex justify-end gap-2">
      {role === "BUSINESS" && <button onClick={() => patch({ verified: !verified }, verified ? "Verification removed" : "Business verified")} className="rounded-lg border border-line px-2.5 py-1 text-xs hover:bg-soft">{verified ? "Unverify" : "Verify"}</button>}
      <select aria-label="Role" defaultValue={role} onChange={(e) => patch({ role: e.target.value }, "Role updated")} className="rounded-lg border border-line bg-soft px-2 py-1 text-xs"><option>USER</option><option>BUSINESS</option><option>ADMIN</option></select>
      <button onClick={() => patch({ isActive: !active }, active ? "Account deactivated" : "Account reactivated")} className={`rounded-lg px-2.5 py-1 text-xs ${active ? "bg-danger/15 text-danger" : "bg-success/15 text-success"}`}>{active ? "Deactivate" : "Reactivate"}</button>
    </div>
  );
}
