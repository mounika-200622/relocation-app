"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Accessible modal built on <dialog>: focus trap, Esc to close, click backdrop to close. */
export function Modal({ open, onClose, title, children, className, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-3xl border border-line bg-elev p-0 text-fg shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-fade-up",
        wide ? "max-w-3xl" : "max-w-lg",
        className,
      )}
      aria-label={title}
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-fg" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
    </dialog>
  );
}
