import type { Metadata } from "next";
import { pageUser } from "@/lib/session";
import { ListingForm, EMPTY_LISTING } from "@/components/listing/listing-form";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  await pageUser(["BUSINESS"]);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
      <PageHeader eyebrow="New listing" title="List a place" description="Fill in the details, then add photos on the next step. You can edit everything later." />
      <ListingForm initial={EMPTY_LISTING} />
    </div>
  );
}
