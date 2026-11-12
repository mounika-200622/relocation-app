"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client";

export function ResolveReport({ id, status, hasListing, hasUser }: { id: number; status: string; hasListing: boolean; hasUser: boolean }) {
  const router = useRouter();
  const send = async (json: object, msg: string) => {
    try {
      await api(`/api/admin/reports/${id}`, { method: "PATCH", json });
      toast.success(msg);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  if (status !== "OPEN") return <button onClick={() => send({ status: "OPEN" }, "Reopened")} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-soft">Reopen</button>;
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => send({ status: "DISMISSED" }, "Dismissed")} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-soft">Dismiss</button>
      <button onClick={() => send({ status: "REVIEWED" }, "Marked as reviewed")} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-soft">Reviewed</button>
      {hasListing && <button onClick={() => send({ status: "REVIEWED", archiveListing: true }, "Listing archived")} className="rounded-lg bg-warning/15 px-3 py-1.5 text-xs text-warning">Archive listing</button>}
      {hasUser && <button onClick={() => send({ status: "REVIEWED", deactivateUser: true }, "User deactivated")} className="rounded-lg bg-danger/15 px-3 py-1.5 text-xs text-danger">Deactivate user</button>}
    </div>
  );
}
