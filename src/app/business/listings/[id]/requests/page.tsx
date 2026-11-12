import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { requestsForListing } from "@/lib/roommates";
import { EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { RequestsTable } from "./requests-table";

export const metadata: Metadata = { title: "Roommate requests" };
export const dynamic = "force-dynamic";

export default async function OwnerRequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await pageUser(["BUSINESS", "ADMIN"]);
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const l = await prisma.listing.findUnique({ where: { id }, select: { id: true, ownerId: true, title: true, status: true, isShareable: true, capacityMax: true, currentOccupants: true } });
  if (!l || (l.ownerId !== user.id && user.role !== "ADMIN")) notFound();
  const requests = await requestsForListing(id, null, { includeClosed: true });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8">
      <PageHeader eyebrow={<Link href="/business" className="hover:underline">← Dashboard</Link>} title="Roommate requests" description={<Link href={`/listings/${l.id}`} className="hover:underline">{l.title}</Link>} />
      <div className="card mb-6 p-5">
        <div className="flex justify-between text-sm"><span className="text-muted">Occupancy</span><span className="font-semibold tabular-nums">{l.currentOccupants} / {l.capacityMax}</span></div>
        <Progress value={(l.currentOccupants / l.capacityMax) * 100} className="mt-3" tone={l.currentOccupants >= l.capacityMax ? "warm" : "accent"} />
        <p className="mt-3 text-xs text-subtle">Accepting runs in one database transaction: the listing row is locked, the request is matched, occupancy goes up, and if the place is full every other open request is closed automatically.</p>
      </div>
      {!l.isShareable ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Sharing is turned off">Enable &ldquo;People can share this place&rdquo; in the listing settings to receive requests.</EmptyState>
      ) : requests.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No requests yet">When someone asks to share this place you&apos;ll see them here and get a notification.</EmptyState>
      ) : (
        <RequestsTable requests={requests} full={l.currentOccupants >= l.capacityMax} />
      )}
    </div>
  );
}
