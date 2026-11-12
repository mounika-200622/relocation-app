import type { Metadata } from "next";
import Link from "next/link";
import { Plane, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { formatDate, formatMoney, num } from "@/lib/format";
import { EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { WhereAmI } from "@/components/where-am-i";

export const metadata: Metadata = { title: "My trips" };
export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const user = await pageUser(["USER", "ADMIN"]);
  const trips = await prisma.itinerary.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, days: true, peopleCount: true, budget: true, currency: true, startDate: true, city: { select: { name: true, country: { select: { name: true, flag: true } } } }, items: { select: { estimatedCost: true, kind: true } } },
  });
  const covers = ["/samples/home-04.svg", "/samples/home-10.svg", "/samples/home-13.svg", "/samples/home-16.svg"];
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      <PageHeader eyebrow="Trip planner" title="My trips" description="Day-by-day plans that never go over budget." actions={<LinkButton href="/trip/new"><Plus className="h-4 w-4" /> Plan a trip</LinkButton>} />
      <WhereAmI className="mb-8" compact />
      {trips.length === 0 ? (
        <EmptyState icon={<Plane className="h-6 w-6" />} title="No trips yet" action={<LinkButton href="/trip/new">Plan your first trip</LinkButton>}>Pick a city, a budget and what you like — we&apos;ll build the days.</EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t, i) => {
            const budget = num(t.budget) ?? 0;
            const spent = t.items.reduce((s, x) => s + (num(x.estimatedCost) ?? 0), 0);
            return (
              <Link key={t.id} href={`/trip/${t.id}`} className="group overflow-hidden rounded-3xl border border-line bg-elev transition hover:-translate-y-1 hover:shadow-2xl">
                <div className="relative h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={covers[i % covers.length]} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white"><div className="text-xs opacity-80">{t.city.country.flag} {t.city.country.name}</div><div className="text-xl font-semibold">{t.city.name}</div></div>
                </div>
                <div className="p-5">
                  <div className="font-semibold">{t.title}</div>
                  <div className="mt-1 text-sm text-muted">{t.days} days · {t.peopleCount} {t.peopleCount === 1 ? "person" : "people"}{t.startDate ? ` · ${formatDate(t.startDate)}` : ""}</div>
                  <div className="mt-4 flex justify-between text-sm"><span className="text-muted">Planned</span><span className="font-medium tabular-nums">{formatMoney(spent, t.currency)} / {formatMoney(budget, t.currency)}</span></div>
                  <Progress value={budget ? (spent / budget) * 100 : 0} className="mt-2" tone={spent > budget ? "danger" : "accent"} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
