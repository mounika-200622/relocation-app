import Link from "next/link";
import { Compass } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-accent-soft text-accent"><Compass className="h-8 w-8" /></div>
      <p className="mt-6 font-display text-6xl italic text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have moved, or the place was removed by its owner.</p>
      <div className="mt-8 flex gap-3">
        <LinkButton href="/">Go home</LinkButton>
        <Link href="/relocate" className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-muted hover:text-fg">Browse places</Link>
      </div>
    </div>
  );
}
