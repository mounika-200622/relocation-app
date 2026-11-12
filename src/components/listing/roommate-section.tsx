"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, MessageCircle, UserPlus, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ScoreRing } from "@/components/score-ring";
import { api } from "@/lib/client";
import { formatDate, formatMoney, titleCase } from "@/lib/format";

export type RequestRow = {
  id: number; status: string; message: string; moveInDate: string | null; budgetShare: number | null; currency: string; createdAt: string;
  requester: { id: number; name: string; occupation: string; organization: string | null }; score: number | null; isMine: boolean;
};

/** "People looking to share this place": public list, compatibility, message, request form. */
export function RoommateSection({ listingId, ownerId, requests, canRequest, spotsLeft, currency, suggestedShare }: {
  listingId: number; ownerId: number; requests: RequestRow[]; canRequest: boolean; spotsLeft: number; currency: string; suggestedShare: number;
}) {
  const { data } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ message: "", moveInDate: "", budgetShare: String(suggestedShare) });
  const [busy, setBusy] = useState<string | null>(null);
  const me = data?.user;
  const mine = requests.find((r) => r.isMine && r.status === "OPEN");

  const message = async (r: RequestRow) => {
    if (!me) return router.push(`/login?callbackUrl=/listings/${listingId}`);
    setBusy(`m${r.id}`);
    try {
      const res = await api<{ conversationId: number }>("/api/chat", { method: "POST", json: { requestId: r.id } });
      router.push(`/chat/${res.conversationId}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  const submit = async () => {
    setBusy("submit");
    try {
      await api(`/api/listings/${listingId}/requests`, { method: "POST", json: { message: form.message, moveInDate: form.moveInDate || null, budgetShare: form.budgetShare ? Number(form.budgetShare) : null } });
      toast.success("You're on the list! People can now message you about sharing.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const withdraw = async (id: number) => {
    setBusy(`w${id}`);
    try {
      await api(`/api/requests/${id}`, { method: "PATCH", json: { action: "withdraw" } });
      toast.success("Request withdrawn");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const open_ = requests.filter((r) => r.status === "OPEN");

  return (
    <section id="roommates" className="scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">People looking to share this place</h2>
          <p className="text-sm text-muted">{spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left · compatibility is based on your profile</p>
        </div>
        {me?.role === "USER" && me.id !== ownerId && (mine ? (
          <Button variant="secondary" loading={busy === `w${mine.id}`} onClick={() => withdraw(mine.id)}>Withdraw my request</Button>
        ) : canRequest ? (
          <Button onClick={() => setOpen(true)}><UserPlus className="h-4 w-4" /> I want to share this</Button>
        ) : null)}
        {!me && canRequest && <Link href={`/login?callbackUrl=/listings/${listingId}%23roommates`} className="text-sm font-medium text-accent hover:underline">Log in to join</Link>}
      </div>

      {open_.length === 0 ? (
        <div className="mt-5"><EmptyState icon={<Users className="h-6 w-6" />} title="No one yet">Be the first — others moving here will see you and can message you.</EmptyState></div>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {open_.map((r) => (
            <li key={r.id} className="card flex gap-4 p-5">
              <Avatar name={r.requester.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{r.requester.name} {r.isMine && <Badge tone="accent">You</Badge>}</div>
                    <div className="text-xs text-subtle">{titleCase(r.requester.occupation)}{r.requester.organization ? ` · ${r.requester.organization}` : ""}</div>
                  </div>
                  {r.score !== null && <ScoreRing score={r.score} size={46} />}
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{r.message}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-subtle">
                  {r.moveInDate && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(r.moveInDate)}</span>}
                  {r.budgetShare !== null && <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{formatMoney(r.budgetShare, r.currency)}/mo</span>}
                </div>
                {!r.isMine && me?.id !== r.requester.id && (
                  <Button size="sm" variant="secondary" className="mt-3" loading={busy === `m${r.id}`} onClick={() => message(r)}>
                    <MessageCircle className="h-3.5 w-3.5" /> Message
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Ask to share this place">
        <div className="space-y-4">
          <Field label="A short note" hint="Who you are, when you arrive, how you like to live.">
            {(a) => <Textarea {...a} value={form.message} maxLength={600} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Hi! I'm starting my master's in September…" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Move-in date" optional>{(a) => <Input {...a} type="date" value={form.moveInDate} onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} />}</Field>
            <Field label={`My budget share (${currency})`} optional>{(a) => <Input {...a} inputMode="numeric" value={form.budgetShare} onChange={(e) => setForm({ ...form, budgetShare: e.target.value.replace(/\D/g, "") })} />}</Field>
          </div>
          <Button className="w-full" loading={busy === "submit"} disabled={form.message.trim().length < 10} onClick={submit}>Post my request</Button>
        </div>
      </Modal>
    </section>
  );
}
