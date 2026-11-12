import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary:
    "bg-accent-strong text-white shadow-[0_8px_24px_-8px_rgb(99_102_241/0.7)] hover:brightness-110 border border-white/10",
  secondary: "bg-soft text-fg border border-line hover:bg-hover hover:border-line-strong",
  outline: "bg-transparent text-fg border border-line-strong hover:bg-soft",
  ghost: "bg-transparent text-muted hover:text-fg hover:bg-soft",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-[15px] rounded-2xl",
  icon: "h-10 w-10 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant = "primary", size = "md", className, ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
