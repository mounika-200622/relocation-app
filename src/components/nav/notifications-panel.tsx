"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/misc";
import { announceUnreadChanged } from "@/components/nav/unread";
import { cn } from "@/lib/cn";

type N = { id: string; title: string; body: string | null; link: string | null; createdAt: string; read: boolean };

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<N[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => alive && setItems(d.items))
      .catch(() => alive && setItems([]));
    // opening the panel marks everything read
    fetch("/api/notifications", { method: "POST" }).then(announceUnreadChanged).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] card p-2 animate-fade-up" role="dialog" aria-label="Notifications">
      <div className="px-3 py-2 text-sm font-semibold">Notifications</div>
      {items === null ? (
        <div className="space-y-2 p-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-sm text-subtle">
          <Bell className="h-5 w-5" /> You&apos;re all caught up.
        </div>
      ) : (
        <ul className="max-h-96 overflow-y-auto">
          {items.map((n) => (
            <li key={n.id}>
              <Link href={n.link ?? "#"} onClick={onClose} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-soft">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{n.title}</span>
                  {n.body && <span className="block text-xs text-muted line-clamp-2">{n.body}</span>}
                  <span className="block text-[11px] text-subtle mt-0.5">{relativeTime(n.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
