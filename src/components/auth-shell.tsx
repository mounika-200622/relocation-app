import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";

const QUOTES = [
  { text: "I found a shared flat near ETH and my two flatmates in the same week.", who: "Aarav · MSc student, Zürich" },
  { text: "The checklist told me to register within 14 days. Nobody else did.", who: "Yuki · consultant, Geneva" },
];

/** Split-screen auth layout: form left, brand panel right (hidden on phones). */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  const q = QUOTES[title.length % QUOTES.length]!;
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="safe-top flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo className="text-3xl" />
          <ThemeToggle className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-soft hover:text-fg" />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10 animate-fade-up">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/samples/home-07.svg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-indigo-950/30" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="font-display text-3xl italic leading-snug">&ldquo;{q.text}&rdquo;</p>
          <p className="mt-4 text-sm opacity-80">{q.who}</p>
        </div>
      </div>
    </div>
  );
}
