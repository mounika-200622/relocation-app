import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Plane } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WhereAmI } from "@/components/where-am-i";

export const metadata: Metadata = { title: "Where to?" };

export default async function ChoosePathPage() {
  const session = await auth();
  const first = session?.user?.name?.split(" ")[0] ?? "there";
  const profile = session?.user?.id
    ? await prisma.userProfile.findUnique({ where: { userId: session.user.id }, select: { organization: true, destinationCity: { select: { name: true, photoUrl: true, country: { select: { flag: true, currency: true, photoUrl: true } } } } } })
    : null;
  const dest = profile?.destinationCity ?? null;
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center px-4 py-12 md:px-6">
      <p className="text-sm text-accent animate-fade-up">Welcome, {first}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl animate-fade-up">What brings you to Nira <span className="font-display italic">today?</span></h1>
      <p className="mt-4 text-muted animate-fade-up">You can switch between the two any time from the top bar.</p>
      <WhereAmI className="mt-8" />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {dest ? (
          <PathCard
            href="/relocate/home"
            icon={<Compass className="h-6 w-6" />}
            title={`My move to ${dest.name} ${dest.country.flag ?? ""}`}
            text={`Everything about ${dest.name}: ${dest.country.currency} exchange rate, SIM cards, transport, first-week checklist and homes nearest ${profile?.organization || "the centre"}.`}
            img={dest.photoUrl ?? dest.country.photoUrl ?? "/photos/homes/home-24.jpg"}
          />
        ) : (
          <PathCard href="/relocate/home" icon={<Compass className="h-6 w-6" />} title="I'm moving to a new country" text="Housing, roommates, nearby essentials and a step-by-step settling-in guide." img="/photos/homes/home-24.jpg" />
        )}
        <PathCard href="/trip" icon={<Plane className="h-6 w-6" />} title="I'm planning a trip" text="A day-by-day itinerary — stay, food, sights and transport — that fits your budget." img="/photos/places/country-ch.jpg" />
      </div>
    </div>
  );
}

function PathCard({ href, icon, title, text, img }: { href: string; icon: React.ReactNode; title: string; text: string; img: string }) {
  return (
    <Link href={href} className="group overflow-hidden rounded-[1.75rem] border border-line bg-elev transition hover:-translate-y-1 hover:border-line-strong hover:shadow-2xl animate-fade-up">
      <div className="relative h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elev)] to-transparent" />
      </div>
      <div className="p-7 pt-2">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">{icon}</span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted">{text}</p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">Continue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}
