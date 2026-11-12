import type { Metadata } from "next";
import { pageUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/misc";
import { TripForm } from "./trip-form";

export const metadata: Metadata = { title: "Plan a trip" };

export default async function NewTripPage() {
  await pageUser(["USER", "ADMIN"]);
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8">
      <PageHeader eyebrow="Trip planner" title={<>Plan a trip that <span className="font-display italic">fits your budget</span></>} description="We pull real places from OpenStreetMap, price them with local cost data and build each day around where you sleep." />
      <TripForm />
    </div>
  );
}
