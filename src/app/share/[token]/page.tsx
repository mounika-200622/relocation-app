import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { ItineraryView } from "@/components/trip/itinerary-view";
import { Logo } from "@/components/brand";

export const metadata: Metadata = { title: "Shared trip", robots: { index: false } };

/** Public, read-only view of an itinerary shared by its owner (token link). */
export default async function SharedTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
  const trip = await loadTrip({ shareToken: token });
  if (!trip) notFound();
  return (
    <>
      <div className="no-print border-b border-line">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <Logo className="text-2xl" />
          <Link href="/signup" className="text-sm font-medium text-accent hover:underline">Plan your own trip →</Link>
        </div>
      </div>
      <ItineraryView trip={{ ...trip, userId: 0, shareToken: null }} readOnly />
    </>
  );
}
