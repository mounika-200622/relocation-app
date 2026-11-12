import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { cardsByIds } from "@/lib/listings";
import { num } from "@/lib/format";
import { ListingCard } from "@/components/listing-card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Saved places" };

export default async function SavedPage() {
  const user = await pageUser(["USER", "ADMIN"]);
  const [saved, profile] = await Promise.all([
    prisma.savedListing.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { listingId: true } }),
    prisma.userProfile.findUnique({ where: { userId: user.id }, select: { budgetMonthly: true, budgetCurrency: true } }),
  ]);
  const cards = (await cardsByIds(saved.map((s) => s.listingId))).map((c) => ({ ...c, saved: true }));
  const budget = profile?.budgetMonthly ? { amount: num(profile.budgetMonthly)!, currency: profile.budgetCurrency ?? "" } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      <PageHeader
        title="Saved places"
        description={`${cards.length} place${cards.length === 1 ? "" : "s"} you're keeping an eye on.`}
        actions={cards.length >= 2 ? <LinkButton href={`/compare?ids=${cards.slice(0, 3).map((c) => c.id).join(",")}`} variant="secondary">Compare up to 3</LinkButton> : null}
      />
      {cards.length === 0 ? (
        <EmptyState icon={<Heart className="h-6 w-6" />} title="No saved places yet" action={<LinkButton href="/relocate">Find a place</LinkButton>}>Tap the heart on any place to save it here.</EmptyState>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{cards.map((l) => <ListingCard key={l.id} l={l} budget={budget} />)}</div>
      )}
    </div>
  );
}
