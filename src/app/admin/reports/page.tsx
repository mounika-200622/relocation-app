import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { relativeTime, titleCase } from "@/lib/format";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { ResolveReport } from "./resolve";

export const metadata: Metadata = { title: "Reports · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReports() {
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { reporter: { select: { name: true } }, reportedUser: { select: { id: true, name: true } }, listing: { select: { id: true, title: true } }, resolvedBy: { select: { name: true } } },
  });
  return (
    <div>
      <PageHeader title="Reports queue" description="Review reported users and listings. Resolving can archive the listing or deactivate the user in the same transaction." />
      {reports.length === 0 ? <EmptyState icon={<Flag className="h-6 w-6" />} title="Nothing to review">Reports from users will appear here.</EmptyState> : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="card flex flex-col gap-3 p-5 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={r.status === "OPEN" ? "danger" : "neutral"}>{r.status}</Badge>
                  <span className="font-medium">{titleCase(r.reason)}</span>
                  <span className="text-xs text-subtle">by {r.reporter.name} · {relativeTime(r.createdAt)}</span>
                </div>
                <div className="mt-1 text-sm text-muted">
                  {r.listing && <>Listing: <Link href={`/listings/${r.listing.id}`} className="text-accent hover:underline">{r.listing.title}</Link> </>}
                  {r.reportedUser && <>User: <b className="text-fg">{r.reportedUser.name}</b></>}
                </div>
                {r.details && <p className="mt-1 text-sm">{r.details}</p>}
                {r.resolvedBy && <p className="mt-1 text-xs text-subtle">Resolved by {r.resolvedBy.name}</p>}
              </div>
              <ResolveReport id={r.id} status={r.status} hasListing={Boolean(r.listing)} hasUser={Boolean(r.reportedUser)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
