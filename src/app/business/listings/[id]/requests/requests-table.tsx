"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import type { RequestRow } from "@/components/listing/roommate-section";
import { api } from "@/lib/client";
import { formatDate, formatMoney, relativeTime, titleCase } from "@/lib/format";

export function RequestsTable({ requests, full }: { requests: RequestRow[]; full: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: number, action: "accept" | "decline") => {
    setBusy(`${action}${id}`);
    try {
      const r = await api<{ listingFull?: boolean; closedOthers?: number }>(`/api/requests/${id}`, { method: "PATCH", json: { action } });
      toast.success(action === "accept" ? (r.listingFull ? `Accepted — the place is now full${r.closedOthers ? ` and ${r.closedOthers} other request(s) were closed` : ""}.` : "Accepted") : "Declined");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const message = async (requestId: number) => {
    try {
      const r = await api<{ conversationId: number }>("/api/chat", { method: "POST", json: { requestId } });
      router.push(`/chat/${r.conversationId}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="card flex flex-col gap-4 p-5 sm:flex-row">
          <Avatar name={r.requester.name} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{r.requester.name}</span>
              <Badge tone={r.status === "OPEN" ? "accent" : r.status === "MATCHED" ? "success" : "neutral"}>{r.status}</Badge>
              <span className="text-xs text-subtle">{relativeTime(r.createdAt)}</span>
            </div>
            <div className="text-xs text-subtle">{titleCase(r.requester.occupation)}{r.requester.organization ? ` · ${r.requester.organization}` : ""}</div>
            <p className="mt-2 text-sm text-muted">{r.message}</p>
            <div className="mt-2 flex gap-4 text-xs text-subtle">
              {r.moveInDate && <span>Moves in {formatDate(r.moveInDate)}</span>}
              {r.budgetShare !== null && <span>Budget {formatMoney(r.budgetShare, r.currency)}/mo</span>}
            </div>
          </div>
          <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
            <Button size="sm" variant="secondary" onClick={() => message(r.id)}><MessageCircle className="h-3.5 w-3.5" /> Message</Button>
            {r.status === "OPEN" && (
              <>
                <Button size="sm" onClick={() => act(r.id, "accept")} loading={busy === `accept${r.id}`} disabled={full}><Check className="h-3.5 w-3.5" /> Accept</Button>
                <Button size="sm" variant="ghost" onClick={() => act(r.id, "decline")} loading={busy === `decline${r.id}`}><X className="h-3.5 w-3.5" /> Decline</Button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
