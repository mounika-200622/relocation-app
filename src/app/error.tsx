"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";

/** Route-level error boundary: friendly message + retry, details only in the console. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-danger/15 text-danger"><AlertTriangle className="h-8 w-8" /></div>
      <h1 className="mt-6 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted">This part of Nira hit an unexpected error. Your data is safe — try again in a moment.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-subtle">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="secondary">Go home</LinkButton>
      </div>
    </div>
  );
}
