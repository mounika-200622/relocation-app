import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { BadgeCheck } from "lucide-react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "warm";
const tones: Record<Tone, string> = {
  neutral: "bg-soft text-muted border-line",
  accent: "bg-accent-soft text-accent border-accent/20",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  danger: "bg-danger/12 text-danger border-danger/25",
  warm: "bg-warm/12 text-warm border-warm/25",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 h-6 text-[11.5px] font-medium tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

const AVATAR_HUES = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ef4444", "#84cc16"];

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const hue = AVATAR_HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_HUES.length];
  return (
    <span
      aria-hidden
      className={cn("inline-grid place-items-center rounded-full font-semibold text-white shrink-0 ring-2 ring-bg", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${hue}, ${hue}aa)` }}
    >
      {initials(name)}
    </span>
  );
}

export function Verified({ className }: { className?: string }) {
  return (
    <span title="Verified business" className={cn("inline-flex items-center gap-1 text-accent text-xs font-medium", className)}>
      <BadgeCheck className="h-4 w-4" aria-hidden /> Verified
    </span>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center text-center px-6 py-14 animate-fade-up">
      {icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions, className }: { eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8 animate-fade-up", className)}>
      <div>
        {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</div>}
        <h1 className="text-3xl md:text-[2.6rem] font-semibold tracking-tight leading-[1.1]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[15px] text-muted leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between text-muted">
        <span className="text-[13px] font-medium">{label}</span>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-subtle">{hint}</div>}
    </div>
  );
}

export function Progress({ value, className, tone = "accent" }: { value: number; className?: string; tone?: "accent" | "success" | "danger" | "warm" }) {
  const color = { accent: "bg-accent-strong", success: "bg-success", danger: "bg-danger", warm: "bg-warm" }[tone];
  return (
    <div className={cn("h-2 w-full rounded-full bg-hover overflow-hidden", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function SectionTitle({ children, action, id }: { children: React.ReactNode; action?: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="flex items-center justify-between mb-4 scroll-mt-24">
      <h2 className="text-xl font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}
