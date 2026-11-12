"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/misc";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";

type Item = { id: number; title: string; description: string; category: string; dueWithinDays: number | null; link: string | null; done: boolean };

/** Tick-off checklist; progress is saved per user (UserChecklistProgress). */
export function Checklist({ items: initial, loggedIn }: { items: Item[]; loggedIn: boolean }) {
  const [items, setItems] = useState(initial);
  const done = items.filter((i) => i.done).length;

  const toggle = async (id: number) => {
    if (!loggedIn) return toast.info("Log in to save your progress.");
    const item = items.find((i) => i.id === id)!;
    setItems((s) => s.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
    try {
      await api(`/api/checklist/${id}`, { method: item.done ? "DELETE" : "POST" });
    } catch (e) {
      setItems((s) => s.map((i) => (i.id === id ? { ...i, done: item.done } : i)));
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line p-5">
        <div className="flex items-center justify-between text-sm"><span className="font-medium">{done} of {items.length} done</span><span className="text-subtle">{Math.round((done / items.length) * 100)}%</span></div>
        <Progress value={(done / items.length) * 100} className="mt-3" tone={done === items.length ? "success" : "accent"} />
        {!loggedIn && <p className="mt-3 text-xs text-subtle"><Link href="/login" className="text-accent hover:underline">Log in</Link> to save your progress.</p>}
      </div>
      <ol className="divide-y divide-line">
        {items.map((i, n) => (
          <li key={i.id} className="flex gap-4 px-5 py-4">
            <button onClick={() => toggle(i.id)} role="checkbox" aria-checked={i.done} aria-label={i.title} className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition", i.done ? "border-accent-strong bg-accent-strong text-white" : "border-line-strong hover:border-accent")}>
              {i.done && <Check className="h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className={cn("font-medium", i.done && "text-subtle line-through")}><span className="mr-2 text-subtle">{n + 1}.</span>{i.title}</div>
              <p className="mt-0.5 text-sm text-muted">{i.description}</p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-subtle">
                {i.dueWithinDays && <span>Within {i.dueWithinDays} days</span>}
                {i.link && <a href={i.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">Official info <ExternalLink className="h-3 w-3" /></a>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
