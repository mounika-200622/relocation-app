import Link from "next/link";
import { cn } from "@/lib/cn";

/** The Nira. wordmark (Playfair Display italic, indigo full stop). */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("font-display italic font-bold tracking-tight leading-none", className)} aria-label="Nira home">
      Nira<span className="text-accent">.</span>
    </Link>
  );
}
