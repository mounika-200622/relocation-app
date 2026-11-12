"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/cn";
import { activeHref, mobileTabsFor, modeFromPath } from "@/components/nav/nav-config";
import { useUnread } from "@/components/nav/unread";

const HIDE_ON = ["/login", "/signup", "/forgot-password", "/reset-password", "/onboarding", "/share/"];

/** Native-app style bottom navigation on phones (and in the Android app). */
export function MobileTabBar() {
  const pathname = usePathname();
  const { data } = useSession();
  const { counts } = useUnread();
  const role = data?.user?.role ?? null;
  if (HIDE_ON.some((p) => pathname.startsWith(p)) || /^\/chat\/\d+/.test(pathname)) return null;
  const tabs = mobileTabsFor(role, modeFromPath(pathname));
  const current = activeHref(pathname, tabs);

  return (
    <nav aria-label="Primary" className="no-print md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl safe-bottom">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => {
          const active = current === t.href;
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={active ? "page" : undefined} className={cn("relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10.5px] font-medium", active ? "text-fg" : "text-subtle")}>
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-accent-soft text-accent")}>
                  <Icon className="h-[19px] w-[19px]" />
                </span>
                {t.label}
                {t.badge === "messages" && counts.messages > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent-strong px-1 text-[9px] font-bold text-white">{counts.messages}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
