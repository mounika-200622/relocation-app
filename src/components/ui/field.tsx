"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "w-full h-11 rounded-xl bg-soft border border-line px-3.5 text-sm text-fg placeholder:text-subtle outline-none transition focus:border-accent/60 focus:ring-4 focus:ring-accent/15 disabled:opacity-60 aria-[invalid=true]:border-danger/60";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
  optional?: boolean;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
};

/** Label + control + hint/error, wired up with ids for screen readers. */
export function Field({ label, hint, error, className, optional, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-muted">
        {label} {optional && <span className="text-subtle font-normal">(optional)</span>}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "h-auto min-h-28 py-3 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        inputClass,
        "appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a92a6%22 stroke-width=%222.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_0.85rem_center]",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer py-1">
      <span>
        <span className="block text-sm text-fg">{label}</span>
        {description && <span className="block text-xs text-subtle mt-0.5">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-accent-strong" : "bg-hover border border-line-strong")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5.5" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

/** Pill toggle group used for filters and single choices. */
export function Segmented<T extends string>({ value, onChange, options, className, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string; size?: "sm" | "md" }) {
  return (
    <div role="radiogroup" className={cn("inline-flex rounded-xl bg-soft border border-line p-1 gap-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg font-medium transition",
            size === "sm" ? "px-2.5 h-7 text-xs" : "px-3.5 h-8 text-[13px]",
            value === o.value ? "bg-elev text-fg shadow-sm border border-line-strong" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[13px] font-medium transition whitespace-nowrap",
        active ? "bg-fg text-bg border-fg" : "bg-elev text-muted border-line hover:border-line-strong hover:text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}
