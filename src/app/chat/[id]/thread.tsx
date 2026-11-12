"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Ban, CheckCheck, MoreVertical, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/misc";
import { ReportButton } from "@/components/listing/contact-actions";
import { announceUnreadChanged } from "@/components/nav/unread";
import { api } from "@/lib/client";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

type Msg = { id: string; senderId: number; text: string; sentAt: string; readAt: string | null; pending?: boolean };
type Convo = {
  id: number; other: { id: number; name: string; role: string; verified: boolean }; blocked: boolean;
  listing: { id: number; title: string; price: number | null; currency: string; city: string; coverUrl: string | null } | null;
};
const MAX = 2000;
const POLL_MS = 3000;

export function Thread({ conversationId, meId }: { conversationId: number; meId: number }) {
  const [convo, setConvo] = useState<Convo | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const pane = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | undefined>(undefined);

  // first load
  useEffect(() => {
    api<{ conversation: Convo; messages: Msg[] }>(`/api/chat/${conversationId}/messages`)
      .then((d) => {
        setConvo(d.conversation);
        setMessages(d.messages);
        lastId.current = d.messages.at(-1)?.id;
        announceUnreadChanged();
      })
      .catch((e) => toast.error((e as Error).message));
  }, [conversationId]);

  // poll only for newer messages; pause while the tab is hidden
  const poll = useCallback(async () => {
    if (document.visibilityState !== "visible" || !lastId.current) return;
    try {
      const d = await api<{ messages: Msg[] }>(`/api/chat/${conversationId}/messages?after=${lastId.current}`);
      if (d.messages.length) {
        setMessages((m) => [...m.filter((x) => !d.messages.some((n) => n.id === x.id)), ...d.messages]);
        lastId.current = d.messages.at(-1)!.id;
        announceUnreadChanged();
      }
    } catch {
      /* transient – try again next tick */
    }
  }, [conversationId]);

  useEffect(() => {
    const id = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [poll]);

  useLayoutEffect(() => {
    // scroll only the message pane (scrollIntoView would also scroll the page under the navbar)
    const el = pane.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: messages.length > 30 ? "auto" : "smooth" });
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    const temp: Msg = { id: `tmp-${Date.now()}`, senderId: meId, text: body, sentAt: new Date().toISOString(), readAt: null, pending: true };
    setMessages((m) => [...m, temp]);
    setText("");
    setSending(true);
    try {
      const { message } = await api<{ message: Msg }>(`/api/chat/${conversationId}/messages`, { method: "POST", json: { text: body } });
      setMessages((m) => m.map((x) => (x.id === temp.id ? message : x)));
      lastId.current = message.id;
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== temp.id));
      setText(body);
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const toggleBlock = async () => {
    if (!convo) return;
    try {
      await api(`/api/users/${convo.other.id}/block`, { method: convo.blocked ? "DELETE" : "POST" });
      setConvo({ ...convo, blocked: !convo.blocked });
      toast.success(convo.blocked ? "Unblocked" : `${convo.other.name} can't message you any more`);
      setMenu(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // date separator before the first message of each day
  const showDayAt = messages.map((m, i) => i === 0 || messages[i - 1]!.sentAt.slice(0, 10) !== m.sentAt.slice(0, 10));

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-0 md:px-4 md:py-4">
      <div className="flex h-full flex-col overflow-hidden border-line bg-elev md:rounded-3xl md:border">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Link href="/chat" className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-fg" aria-label="Back to inbox"><ArrowLeft className="h-5 w-5" /></Link>
          {convo ? (
            <>
              <Avatar name={convo.other.name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold">{convo.other.name}{convo.other.verified && <BadgeCheck className="h-4 w-4 text-accent" />}</div>
                <div className="text-xs text-subtle">{convo.other.role === "BUSINESS" ? "Owner" : "Member"}</div>
              </div>
              <div className="relative">
                <button onClick={() => setMenu((m) => !m)} className="rounded-lg p-2 text-muted hover:bg-soft hover:text-fg" aria-label="Conversation options"><MoreVertical className="h-5 w-5" /></button>
                {menu && (
                  <div className="absolute right-0 z-10 mt-1 w-56 card space-y-1 p-2">
                    <button onClick={toggleBlock} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-soft"><Ban className="h-4 w-4" /> {convo.blocked ? "Unblock" : "Block"} {convo.other.name.split(" ")[0]}</button>
                    <div className="px-3 py-2"><ReportButton userId={convo.other.id} label="Report this person" /></div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="skeleton h-10 w-48" />
          )}
        </div>

        {convo?.listing && (
          <Link href={`/listings/${convo.listing.id}`} className="flex items-center gap-3 border-b border-line bg-soft/50 px-4 py-2.5 text-sm hover:bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {convo.listing.coverUrl && <img src={convo.listing.coverUrl} alt="" className="h-10 w-14 rounded-lg object-cover" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{convo.listing.title}</span>
              <span className="text-xs text-subtle">{convo.listing.city} · {formatMoney(convo.listing.price, convo.listing.currency)}/mo</span>
            </span>
          </Link>
        )}

        {/* messages */}
        <div ref={pane} className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5" aria-live="polite">
          {messages.length === 0 && convo && <p className="py-16 text-center text-sm text-subtle">Say hello 👋 — keep personal details inside Nira until you&apos;ve met.</p>}
          {messages.map((m, i) => {
            const mine = m.senderId === meId;
            const showDay = showDayAt[i];
            const nextSame = messages[i + 1]?.senderId === m.senderId;
            return (
              <div key={m.id}>
                {showDay && <div className="my-4 text-center text-[11px] font-medium uppercase tracking-wider text-subtle">{formatDate(m.sentAt, { weekday: "short", day: "numeric", month: "short" })}</div>}
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-relaxed", mine ? "rounded-2xl rounded-br-md bg-accent-strong text-white" : "rounded-2xl rounded-bl-md bg-soft", m.pending && "opacity-60", nextSame && (mine ? "rounded-br-2xl" : "rounded-bl-2xl"))}>
                    {m.text}
                    <div className={cn("mt-1 flex items-center justify-end gap-1 text-[10.5px]", mine ? "text-white/70" : "text-subtle")}>
                      {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {mine && !m.pending && <CheckCheck className={cn("h-3.5 w-3.5", m.readAt ? "text-sky-300" : "")} aria-label={m.readAt ? "Read" : "Sent"} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* composer */}
        {convo?.blocked ? (
          <div className="border-t border-line p-4 text-center text-sm text-muted">You can&apos;t message in this conversation. <button onClick={toggleBlock} className="text-accent hover:underline">Unblock</button></div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="safe-bottom border-t border-line p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-soft p-2 focus-within:border-accent/60">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Write a message…"
                aria-label="Message"
                className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-subtle"
              />
              <button type="submit" disabled={!text.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-strong text-white transition disabled:opacity-40" aria-label="Send">
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 flex justify-between px-2 text-[11px] text-subtle"><span>Enter to send · Shift+Enter for a new line</span><span>{text.length}/{MAX}</span></div>
          </form>
        )}
      </div>
    </div>
  );
}
