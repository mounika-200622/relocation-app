import type { Metadata } from "next";
import { pageUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/misc";
import { TripForm } from "./trip-form";

export const metadata: Metadata = { title: "Plan a trip" };

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ cityId?: string }> }) {
  const user = await pageUser(["USER", "ADMIN"]);
  const raw = Number((await searchParams).cityId);
  // no city in the link: start from the destination on the profile
  const initialCityId = Number.isSafeInteger(raw) && raw > 0
    ? raw
    : (await prisma.userProfile.findUnique({ where: { userId: user.id }, select: { destinationCityId: true } }))?.destinationCityId ?? null;
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8">
      <PageHeader eyebrow="Trip planner" title={<>Plan a trip that <span className="font-display italic">fits your budget</span></>} description="We pull real places from OpenStreetMap, price them with local cost data and build each day around where you sleep." />
      <TripForm initialCityId={initialCityId} />
    </div>
  );
}
