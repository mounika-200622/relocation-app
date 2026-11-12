import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/misc";
import { EssentialsExplorer } from "./explorer";

export const metadata: Metadata = { title: "Nearby essentials" };

export default async function EssentialsPage({ searchParams }: { searchParams: Promise<{ lat?: string; lng?: string; cityId?: string; label?: string }> }) {
  const user = await pageUser();
  const sp = await searchParams;
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id }, select: { destinationCity: { select: { id: true, name: true, lat: true, lng: true, country: { select: { name: true } } } } } });
  const city = profile?.destinationCity;
  const lat = Number(sp.lat) || city?.lat || 47.3769;
  const lng = Number(sp.lng) || city?.lng || 8.5417;
  const label = sp.label ?? (city ? `${city.name}, ${city.country.name}` : "Zürich, Switzerland");
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      <PageHeader eyebrow="Nearby essentials" title="Everything you need, within walking distance" description="Supermarkets, pharmacies, hospitals, SIM shops, banks and stops around any point — live from OpenStreetMap." />
      <EssentialsExplorer lat={lat} lng={lng} cityId={sp.cityId ? Number(sp.cityId) : city?.id ?? null} label={label} />
    </div>
  );
}
