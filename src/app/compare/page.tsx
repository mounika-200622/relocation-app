import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cardsByIds } from "@/lib/listings";
import { nearbyFromCache } from "@/lib/poi/service";
import { LISTING_TYPE_LABEL, PREFERENCE_LABEL, formatDate, formatMoney } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Compare places" };

const NEIGHBOURHOOD = [
  ["Supermarkets", ["SUPERMARKET", "CONVENIENCE"]],
  ["Health (hospital, clinic, pharmacy, doctor)", ["HOSPITAL", "CLINIC", "PHARMACY", "DOCTOR"]],
  ["Transit stops", ["TRANSIT"]],
  ["Places to eat", ["RESTAURANT", "CAFE", "FAST_FOOD"]],
] as const;

/** Side-by-side comparison of up to 3 listings, including "compare neighbourhoods" counts. */
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: raw } = await searchParams;
  const ids = [...new Set((raw ?? "").split(",").map(Number).filter((n) => Number.isSafeInteger(n) && n > 0))].slice(0, 3);
  const session = await auth();
  if (ids.length < 2) {
    const saved = session?.user ? await prisma.savedListing.findMany({ where: { userId: session.user.id }, take: 3, orderBy: { createdAt: "desc" }, select: { listingId: true } }) : [];
    return (
      <div className="mx-auto max-w-3xl px-4 pt-12">
        <EmptyState icon={<Scale className="h-6 w-6" />} title="Pick two or three places to compare" action={saved.length >= 2 ? <LinkButton href={`/compare?ids=${saved.map((s) => s.listingId).join(",")}`}>Compare my saved places</LinkButton> : <LinkButton href="/relocate">Find places</LinkButton>}>
          Save places with the heart, then compare them here side by side — price, size, rules and what&apos;s nearby.
        </EmptyState>
      </div>
    );
  }
  const [cards, details] = await Promise.all([
    cardsByIds(ids),
    prisma.listing.findMany({ where: { id: { in: ids } }, select: { id: true, deposit: true, sizeSqm: true, minStayMonths: true, utilitiesIncluded: true, petsAllowed: true, smokingAllowed: true, _count: { select: { amenities: true } } } }),
  ]);
  const d = new Map(details.map((x) => [x.id, x]));
  const counts = await Promise.all(
    cards.map(async (c) => {
      if (c.lat === null || c.lng === null) return null;
      const all = await nearbyFromCache({ lat: c.lat, lng: c.lng }, 1000, NEIGHBOURHOOD.flatMap(([, cats]) => [...cats]), 200);
      return NEIGHBOURHOOD.map(([, cats]) => all.filter((p) => (cats as readonly string[]).includes(p.category)).length);
    }),
  );

  const rows: [string, (i: number) => React.ReactNode][] = [
    ["Price / month", (i) => <b>{formatMoney(cards[i]!.price, cards[i]!.currency)}</b>],
    ["Deposit", (i) => formatMoney(Number(d.get(cards[i]!.id)?.deposit ?? 0), cards[i]!.currency)],
    ["Type", (i) => LISTING_TYPE_LABEL[cards[i]!.type]],
    ["City", (i) => cards[i]!.cityName],
    ["Size", (i) => (d.get(cards[i]!.id)?.sizeSqm ? `${d.get(cards[i]!.id)!.sizeSqm} m²` : "—")],
    ["Bedrooms", (i) => cards[i]!.bedrooms],
    ["Spots left", (i) => (cards[i]!.isShareable ? cards[i]!.spotsLeft : "Not shareable")],
    ["Available", (i) => (cards[i]!.availableFrom ? formatDate(cards[i]!.availableFrom) : "Now")],
    ["Minimum stay", (i) => `${d.get(cards[i]!.id)?.minStayMonths ?? 1} months`],
    ["Utilities", (i) => (d.get(cards[i]!.id)?.utilitiesIncluded ? "Included" : "Extra")],
    ["Pets / smoking", (i) => `${d.get(cards[i]!.id)?.petsAllowed ? "Pets ok" : "No pets"} · ${d.get(cards[i]!.id)?.smokingAllowed ? "smoking ok" : "no smoking"}`],
    ["Who can live there", (i) => PREFERENCE_LABEL[cards[i]!.genderPreference]],
    ["Amenities", (i) => d.get(cards[i]!.id)?._count.amenities ?? 0],
    ...NEIGHBOURHOOD.map(([label], k) => [`${label} within 1 km`, (i: number) => (counts[i] ? counts[i]![k] : "—")] as [string, (i: number) => React.ReactNode]),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      <PageHeader title="Compare places" description="Neighbourhood counts come from the cached OpenStreetMap data (open a place's “Nearby essentials” to refresh it)." />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              <th className="w-48 p-4" />
              {cards.map((c) => (
                <th key={c.id} className="p-4 text-left align-top font-normal">
                  <Link href={`/listings/${c.id}`} className="group block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.coverUrl && <img src={c.coverUrl} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />}
                    <div className="mt-2 font-semibold group-hover:underline">{c.title}</div>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(([label, cell]) => (
              <tr key={label}>
                <th className="p-4 text-left font-medium text-muted">{label}</th>
                {cards.map((c, i) => <td key={c.id} className="p-4 tabular-nums">{cell(i)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
