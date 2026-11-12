"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Counts = { messages: number; notifications: number };
const Ctx = createContext<{ counts: Counts; refresh: () => void }>({ counts: { messages: 0, notifications: 0 }, refresh: () => {} });

/** Polls unread counts every 20 s while the tab is visible and the user is logged in. */
export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [counts, setCounts] = useState<Counts>({ messages: 0, notifications: 0 });

  const refresh = useCallback(async () => {
    if (status !== "authenticated" || document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/chat/unread", { cache: "no-store" });
      if (res.ok) setCounts(await res.json());
    } catch {
      /* offline: keep the last numbers */
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    // first fetch on the next tick, then every 20 s and whenever the tab becomes visible
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, 20_000);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("nira:unread-changed", refresh);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("nira:unread-changed", refresh);
    };
  }, [status, refresh]);

  return <Ctx.Provider value={{ counts: status === "authenticated" ? counts : { messages: 0, notifications: 0 }, refresh }}>{children}</Ctx.Provider>;
}

export const useUnread = () => useContext(Ctx);

/** Other components call this after reading messages so the badge updates at once. */
export function announceUnreadChanged() {
  window.dispatchEvent(new Event("nira:unread-changed"));
}
