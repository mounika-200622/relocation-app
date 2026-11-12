"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";

/** Heart toggle (optimistic). Anonymous visitors are sent to log in first. */
export function SaveButton({ listingId, initial, variant = "overlay", className }: { listingId: number; initial: boolean; variant?: "overlay" | "pill"; className?: string }) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const { data } = useSession();
  const router = useRouter();

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!data?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (data.user.role !== "USER" && data.user.role !== "ADMIN") {
      toast.info("Saving places is for personal accounts.");
      return;
    }
    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      await api(`/api/listings/${listingId}/save`, { method: next ? "POST" : "DELETE" });
      if (next) toast.success("Saved to your list");
    } catch (err) {
      setSaved(!next);
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (variant === "pill") {
    return (
      <button onClick={toggle} disabled={busy} aria-pressed={saved} className={cn("inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-line bg-soft text-sm font-medium hover:bg-hover", className)}>
        <Heart className={cn("h-4 w-4 transition", saved && "fill-danger text-danger scale-110")} /> {saved ? "Saved" : "Save"}
      </button>
    );
  }
  return (
    <button onClick={toggle} disabled={busy} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save this place"} className={cn("grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur-md text-white transition hover:scale-110 active:scale-95", className)}>
      <Heart className={cn("h-[18px] w-[18px] drop-shadow", saved ? "fill-[#ff385c] text-[#ff385c]" : "fill-black/20")} />
    </button>
  );
}
