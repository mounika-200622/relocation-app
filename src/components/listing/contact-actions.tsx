"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flag, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Select, Textarea } from "@/components/ui/field";
import { api } from "@/lib/client";

export function MessageOwnerButton({ listingId, ownerId, className }: { listingId: number; ownerId: number; className?: string }) {
  const { data } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (data?.user?.id === ownerId) return null;
  return (
    <Button
      size="lg"
      className={className}
      loading={busy}
      onClick={async () => {
        if (!data?.user) return router.push(`/login?callbackUrl=/listings/${listingId}`);
        setBusy(true);
        try {
          const r = await api<{ conversationId: number }>("/api/chat", { method: "POST", json: { listingId } });
          router.push(`/chat/${r.conversationId}`);
        } catch (e) {
          toast.error((e as Error).message);
          setBusy(false);
        }
      }}
    >
      <MessageCircle className="h-4 w-4" /> Message owner
    </Button>
  );
}

export function ShareButton({ title }: { title: string }) {
  return (
    <button
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) await navigator.share({ title, url }).catch(() => {});
        else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied");
        }
      }}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-soft px-4 text-sm font-medium hover:bg-hover"
    >
      <Share2 className="h-4 w-4" /> Share
    </button>
  );
}

export function ReportButton({ listingId, userId, label = "Report this listing" }: { listingId?: number; userId?: number; label?: string }) {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("SCAM");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  if (!data?.user) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm text-subtle underline-offset-4 hover:text-fg hover:underline">
        <Flag className="h-3.5 w-3.5" /> {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        <div className="space-y-4">
          <Field label="Reason">
            {(a) => (
              <Select {...a} value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="SCAM">Looks like a scam</option><option value="FAKE_LISTING">Fake or misleading</option><option value="SPAM">Spam</option>
                <option value="HARASSMENT">Harassment</option><option value="INAPPROPRIATE">Inappropriate content</option><option value="OTHER">Something else</option>
              </Select>
            )}
          </Field>
          <Field label="Details" optional>{(a) => <Textarea {...a} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />}</Field>
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api("/api/reports", { method: "POST", json: { listingId, reportedUserId: userId, reason, details: details || undefined } });
                toast.success("Thanks — our team will review this.");
                setOpen(false);
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Send report
          </Button>
        </div>
      </Modal>
    </>
  );
}

/** Fires the unique-daily-view counter once per page load. */
export function ViewTracker({ listingId }: { listingId: number }) {
  useEffect(() => {
    fetch(`/api/listings/${listingId}/view`, { method: "POST" }).catch(() => {});
  }, [listingId]);
  return null;
}
