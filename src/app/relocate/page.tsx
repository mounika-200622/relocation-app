import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { num } from "@/lib/format";
import { listingSearchSchema } from "@/lib/validators/listing";
import { savedIdsFor, searchListings } from "@/lib/listings";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/misc";
import { SearchFilters } from "./search-filters";
import { ResultsMap } from "./results-map";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Find a place" };

type SP = Record<string, string | string[] | undefined>;

export default async function RelocateSearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const session = await auth();
  const profile = session?.user ? await prisma.userProfile.findUnique({ where: { userId: session.user.id }, select: { budgetMonthly: true, budgetCurrency: true, destinationCityId: true, destinationCity: { select: { name: true, country: { select: { name: true } } } } } }) : null;

  // Pre-fill from the profile unless the URL says otherwise (?all=1 shows everything).
  const usingProfile = !flat.all && !flat.cityId && !flat.countryId && !flat.q && profile?.destinationCityId;
  if (usingProfile) {
    flat.cityId = String(profile!.destinationCityId);
    flat.city = `${profile!.destinationCity!.name}, ${profile!.destinationCity!.country.name}`;
  }
  const budget = profile?.budgetMonthly ? { amount: num(profile.budgetMonthly)!, currency: profile.budgetCurrency ?? "" } : null;
  const filters = listingSearchSchema.parse(flat);
  const result = await searchListings(filters);
  const saved = await savedIdsFor(session?.user?.id, result.items.map((i) => i.id));
  const items = result.items.map((i) => ({ ...i, saved: saved.has(i.id) }));
  const view = flat.view === "map" ? "map" : "list";

  const pageHref = (page: number) => {
    const qs = new URLSearchParams(Object.entries(flat).filter(([, v]) => v !== undefined && v !== "") as [string, string][]);
    qs.set("page", String(page));
    return `/relocate?${qs}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6">
      <SearchFilters initial={flat} budget={budget} total={result.total} />

      {usingProfile && (
        <p className="mt-4 text-sm text-muted">
          Showing places in <b className="text-fg">{flat.city}</b>, your destination. <Link href="/relocate?all=1" className="text-accent hover:underline">Search everywhere</Link>
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<SearchX className="h-6 w-6" />} title="No places match these filters" action={<Link href="/relocate?all=1" className="text-sm font-medium text-accent hover:underline">Clear all filters</Link>}>
            Try a higher budget, another city, or fewer amenities. New places are added every week.
          </EmptyState>
        </div>
      ) : view === "map" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid content-start gap-6 sm:grid-cols-2">
            {items.map((l, i) => <ListingCard key={l.id} l={l} budget={budget} priority={i < 4} />)}
          </div>
          <div className="order-first h-[50vh] overflow-hidden rounded-3xl border border-line lg:sticky lg:top-24 lg:order-none lg:h-[calc(100dvh-8rem)]">
            <ResultsMap items={items.filter((i) => i.lat && i.lng).map((i) => ({ id: i.id, lat: i.lat!, lng: i.lng!, price: i.price, currency: i.currency, title: i.title }))} />
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((l, i) => <ListingCard key={l.id} l={l} budget={budget} priority={i < 4} />)}
        </div>
      )}

      {result.pages > 1 && (
        <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-1.5">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={pageHref(p)} aria-current={p === result.page ? "page" : undefined} className={cn("grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-medium", p === result.page ? "bg-fg text-bg" : "text-muted hover:bg-soft")}>
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
