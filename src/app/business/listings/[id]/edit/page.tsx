import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { num } from "@/lib/format";
import { ListingForm } from "@/components/listing/listing-form";
import { PhotoManager } from "@/components/listing/photo-manager";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await pageUser(["BUSINESS", "ADMIN"]);
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const l = await prisma.listing.findUnique({
    where: { id },
    include: { photos: { orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true, url: true, position: true, caption: true } }, amenities: { select: { amenityId: true } } },
  });
  if (!l || (l.ownerId !== user.id && user.role !== "ADMIN")) notFound();
  const s = (n: unknown) => (n === null || n === undefined ? "" : String(n));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-8">
      <PageHeader eyebrow={<Link href="/business" className="hover:underline">← Dashboard</Link>} title="Edit listing" description={l.title} />
      <PhotoManager listingId={l.id} initial={l.photos} />
      <ListingForm
        listingId={l.id}
        initial={{
          title: l.title, description: l.description ?? "", type: l.type, address: l.address, cityId: l.cityId, lat: l.lat, lng: l.lng,
          price: s(num(l.price)), deposit: s(num(l.deposit)), currency: l.currency, bedrooms: s(l.bedrooms), bathrooms: s(l.bathrooms), sizeSqm: s(l.sizeSqm),
          furnished: l.furnished, availableFrom: l.availableFrom ? l.availableFrom.toISOString().slice(0, 10) : "", minStayMonths: s(l.minStayMonths),
          utilitiesIncluded: l.utilitiesIncluded, billsEstimate: s(num(l.billsEstimate)), petsAllowed: l.petsAllowed, smokingAllowed: l.smokingAllowed,
          guestsAllowed: l.guestsAllowed, isShareable: l.isShareable, capacityMin: s(l.capacityMin), capacityMax: s(l.capacityMax),
          currentOccupants: s(l.currentOccupants), genderPreference: l.genderPreference, amenityIds: l.amenities.map((a) => a.amenityId),
        }}
      />
    </div>
  );
}
