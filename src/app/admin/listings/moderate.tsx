"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client";

export function ModerateListing({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="flex justify-end gap-2">
      {status !== "ARCHIVED" ? (
        <button onClick={() => run(() => api(`/api/listings/${id}/status`, { method: "POST", json: { status: "ARCHIVED" } }), "Archived")} className="rounded-lg border border-line px-2.5 py-1 text-xs hover:bg-soft">Archive</button>
      ) : (
        <button onClick={() => run(() => api(`/api/listings/${id}/status`, { method: "POST", json: { status: "ACTIVE" } }), "Restored")} className="rounded-lg border border-line px-2.5 py-1 text-xs hover:bg-soft">Restore</button>
      )}
      <button onClick={() => confirm("Delete this listing permanently?") && run(() => api(`/api/listings/${id}`, { method: "DELETE" }), "Deleted")} className="rounded-lg bg-danger/15 px-2.5 py-1 text-xs text-danger">Delete</button>
    </div>
  );
}
