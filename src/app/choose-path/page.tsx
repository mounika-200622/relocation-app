"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

const paths = [
  {
    href: "/relocate",
    title: "Moving to a new country",
    description:
      "Find housing, roommates, and everything you need to settle in — restaurants, hospitals, transport, and more.",
    cta: "Start relocating",
  },
  {
    href: "/trip",
    title: "Planning a trip",
    description:
      "Tell us your dates, budget, and destination — we'll put together a day-by-day plan that fits.",
    cta: "Plan a trip",
  },
];

export default function ChoosePathPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto text-center mb-12 relative">
        <div className="absolute right-0 top-0 flex items-center gap-4">
          <Link
            href="/chat"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Messages
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Log out
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-3">What brings you here?</h1>
        <p className="text-slate-400">
          You can always switch between these later.
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {paths.map((path) => (
          <Link
            key={path.href}
            href={path.href}
            className="group bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-indigo-400 hover:bg-slate-800 transition-all flex flex-col"
          >
            <h2 className="text-lg font-semibold mb-2">{path.title}</h2>
            <p className="text-slate-400 text-sm mb-6 flex-1">
              {path.description}
            </p>
            <span className="text-indigo-400 text-sm font-medium group-hover:underline">
              {path.cta} →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}