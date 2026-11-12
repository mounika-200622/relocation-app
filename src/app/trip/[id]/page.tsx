import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageUser } from "@/lib/session";
import { loadTrip } from "@/lib/trip/load";
import { ItineraryView } from "@/components/trip/itinerary-view";

export const metadata: Metadata = { title: "Itinerary" };
export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await pageUser(["USER", "ADMIN"]);
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const trip = await loadTrip({ id });
  if (!trip || trip.userId !== user.id) notFound();
  return <ItineraryView trip={trip} />;
}
