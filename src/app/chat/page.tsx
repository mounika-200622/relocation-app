import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { pageUser } from "@/lib/session";
import { inbox } from "@/lib/chat";
import { relativeTime } from "@/lib/format";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await pageUser();
  const items = await inbox(user.id);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
      <PageHeader title="Messages" description="Owners and future flatmates — no phone numbers or emails needed." />
      {items.length === 0 ? (
        <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="No conversations yet" action={user.role === "USER" ? <LinkButton href="/relocate">Find a place</LinkButton> : null}>
          Message an owner from any listing, or someone who wants to share a place.
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/chat/${c.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-soft">
                <div className="relative">
                  <Avatar name={c.other.name} size={48} />
                  {c.listing?.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.listing.coverUrl} alt="" className="absolute -bottom-1 -right-1 h-6 w-6 rounded-md border-2 border-elev object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn("flex items-center gap-1.5 truncate", c.unread ? "font-semibold" : "font-medium")}>
                      {c.other.name}
                      {c.other.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />}
                      {c.isRoommateChat && <Badge tone="success">Roommate</Badge>}
                      {c.other.blocked && <Badge tone="danger">Blocked</Badge>}
                    </span>
                    <span className="shrink-0 text-xs text-subtle">{relativeTime(c.lastMessageAt)}</span>
                  </div>
                  {c.listing && <div className="truncate text-xs text-accent">{c.listing.title}</div>}
                  <div className="mt-0.5 flex items-center justify-between gap-3">
                    <span className={cn("truncate text-sm", c.unread ? "text-fg" : "text-muted")}>{c.lastMessagePreview ? `${c.lastFromMe ? "You: " : ""}${c.lastMessagePreview}` : "No messages yet"}</span>
                    {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-strong px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
