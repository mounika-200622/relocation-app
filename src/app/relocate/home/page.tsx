import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Heart, MapPin, MessageCircle, Search, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { cardsByIds } from "@/lib/listings";
import { topMatches } from "@/lib/roommates";
import { formatDate, formatMoney, num } from "@/lib/format";
import { ListingCard } from "@/components/listing-card";
import { ScoreRing } from "@/components/score-ring";
import { EmptyState, Progress, SectionTitle } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your move" };

export default async function RelocationHome() {
  const user = await pageUser(["USER", "ADMIN"]);
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { budgetMonthly: true, budgetCurrency: true, moveInDate: true, destinationCity: { select: { id: true, name: true, lat: true, lng: true, country: { select: { id: true, name: true, isoCode: true, flag: true } } } } },
  });
  const city = profile?.destinationCity ?? null;
  const countryId = city?.country.id;

  const [checklistTotal, checklistDone, savedCount, recent, matches, myRequests] = await Promise.all([
    countryId ? prisma.checklistTemplate.count({ where: { countryId } }) : 0,
    countryId ? prisma.userChecklistProgress.count({ where: { userId: user.id, item: { countryId } } }) : 0,
    prisma.savedListing.count({ where: { userId: user.id } }),
    // recently viewed: latest distinct listings from the views table
    prisma.listingView.groupBy({ by: ["listingId"], where: { viewerId: user.id }, _max: { viewedAt: true }, orderBy: { _max: { viewedAt: "desc" } }, take: 4 }),
    topMatches(user.id, 3),
    prisma.roommateRequest.findMany({ where: { requesterId: user.id }, orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, status: true, listing: { select: { id: true, title: true } } } }),
  ]);
  const recentCards = await cardsByIds(recent.map((r) => r.listingId));
  const daysToMove = profile?.moveInDate ? Math.ceil((profile.moveInDate.getTime() - Date.now()) / 86_400_000) : null;
  const pct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const budget = profile?.budgetMonthly ? { amount: num(profile.budgetMonthly)!, currency: profile.budgetCurrency ?? "" } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      <header className="animate-fade-up">
        <p className="text-sm text-accent">Hi {user.name.split(" ")[0]}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">
          {city ? <>Your move to <span className="font-display italic">{city.name}</span> {city.country.flag}</> : "Where are you moving?"}
        </h1>
      </header>

      {!city && (
        <div className="mt-6 card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">Add your destination and budget to get matched searches, roommates and a checklist.</p>
          <LinkButton href="/profile">Complete profile</LinkButton>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={<Wallet />} label="Monthly budget" value={budget ? formatMoney(budget.amount, budget.currency) : "Not set"} href="/profile" />
        <Tile icon={<CalendarDays />} label="Move-in" value={profile?.moveInDate ? formatDate(profile.moveInDate) : "Not set"} hint={daysToMove !== null && daysToMove >= 0 ? `in ${daysToMove} days` : undefined} href="/profile" />
        <Tile icon={<Heart />} label="Saved places" value={savedCount} href="/saved" />
        <Link href={city ? `/guide/${city.country.isoCode.toLowerCase()}#checklist` : "/guide"} className="card p-5 transition hover:border-line-strong">
          <div className="flex items-center justify-between text-[13px] text-muted"><span>First-week checklist</span><BookOpen className="h-4 w-4 text-subtle" /></div>
          <div className="mt-3 text-3xl font-semibold tabular-nums">{checklistDone}<span className="text-lg text-subtle">/{checklistTotal || "–"}</span></div>
          <Progress value={pct} className="mt-3" />
        </Link>
      </div>

      <nav aria-label="Quick links" className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          ["/relocate", "Find a place", Search], ["/roommates", "Roommates", Users], ["/essentials", "Essentials", MapPin],
          [city ? `/guide/${city.country.isoCode.toLowerCase()}` : "/guide", "Guide", BookOpen], ["/chat", "Messages", MessageCircle], ["/saved", "Saved", Heart],
        ].map(([href, label, Icon]) => {
          const I = Icon as typeof Search;
          return (
            <Link key={href as string} href={href as string} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-elev py-4 text-[13px] font-medium text-muted transition hover:-translate-y-0.5 hover:text-fg">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><I className="h-5 w-5" /></span>
              {label as string}
            </Link>
          );
        })}
      </nav>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <SectionTitle action={<Link href="/relocate" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">Search <ArrowRight className="h-4 w-4" /></Link>}>Recently viewed</SectionTitle>
          {recentCards.length ? (
            <div className="grid gap-6 sm:grid-cols-2">{recentCards.map((l) => <ListingCard key={l.id} l={l} budget={budget} showSave={false} />)}</div>
          ) : (
            <EmptyState icon={<Search className="h-6 w-6" />} title="Nothing viewed yet" action={<LinkButton href="/relocate">Start searching</LinkButton>}>Places you open will show up here.</EmptyState>
          )}
        </section>
        <aside className="space-y-10">
          <section>
            <SectionTitle action={<Link href="/roommates" className="text-sm text-muted hover:text-fg">See all</Link>}>Top roommate matches</SectionTitle>
            {matches.length ? (
              <ul className="space-y-3">
                {matches.map((m) => (
                  <li key={m.requestId}>
                    <Link href={`/listings/${m.listingId}#roommates`} className="card flex items-center gap-4 p-4 hover:border-line-strong">
                      <ScoreRing score={m.score} size={48} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{m.name}</div>
                        <div className="truncate text-xs text-subtle">wants to share {m.listingTitle.replace(/ · .*$/, "")}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No open requests in your city yet.</p>
            )}
          </section>
          <section>
            <SectionTitle>Your requests</SectionTitle>
            {myRequests.length ? (
              <ul className="space-y-2">
                {myRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm">
                    <Link href={`/listings/${r.listing.id}`} className="truncate hover:underline">{r.listing.title}</Link>
                    <span className={`shrink-0 text-xs font-semibold ${r.status === "MATCHED" ? "text-success" : r.status === "OPEN" ? "text-accent" : "text-subtle"}`}>{r.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">You haven&apos;t asked to share a place yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Tile({ icon, label, value, hint, href }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string; href: string }) {
  return (
    <Link href={href} className="card p-5 transition hover:border-line-strong">
      <div className="flex items-center justify-between text-[13px] text-muted"><span>{label}</span><span className="text-subtle [&>svg]:h-4 [&>svg]:w-4">{icon}</span></div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-subtle">{hint}</div>}
    </Link>
  );
}
