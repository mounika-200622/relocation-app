import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMoney, num } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui/misc";
import { ModerateListing } from "./moderate";

export const metadata: Metadata = { title: "Listings · Admin" };
export const dynamic = "force-dynamic";

type Row = { id: number; title: string; status: string; price: Prisma.Decimal; currency: string; cityName: string; ownerName: string; ownerVerified: number; reports: bigint; priceRank: bigint };

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const valid = status === "ACTIVE" || status === "RENTED" || status === "ARCHIVED" ? status : null;
  // view + correlated sub-query for open reports + window function ranking price inside each city
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT v.id, v.title, v.status, v.price, v.currency, v.cityName, v.ownerName, v.ownerVerified,
           (SELECT COUNT(*) FROM Report r WHERE r.listingId = v.id AND r.status = 'OPEN') AS reports,
           DENSE_RANK() OVER (PARTITION BY v.cityId ORDER BY v.price DESC) AS priceRank
    FROM v_listing_summary v
    ${valid ? Prisma.sql`WHERE v.status = ${valid}` : Prisma.empty}
    ORDER BY reports DESC, v.createdAt DESC
    LIMIT 300`;
  return (
    <div>
      <PageHeader title="Listings" description="Moderate listings: archive or delete. Reported ones come first." />
      <div className="mb-4 flex gap-2 text-sm">
        {["", "ACTIVE", "RENTED", "ARCHIVED"].map((s) => <Link key={s} href={s ? `/admin/listings?status=${s}` : "/admin/listings"} className={`rounded-full px-3 py-1.5 ${s === (valid ?? "") ? "bg-fg text-bg" : "bg-soft text-muted"}`}>{s || "All"}</Link>)}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle"><tr><th className="px-5 py-3">Listing</th><th className="px-3">Owner</th><th className="px-3">Status</th><th className="px-3">Price</th><th className="px-3" title="Rank by price within its city">City rank</th><th className="px-3">Reports</th><th className="px-5 text-right" /></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3"><Link href={`/listings/${r.id}`} className="font-medium hover:underline">{r.title}</Link><div className="text-xs text-subtle">{r.cityName}</div></td>
                <td className="px-3">{r.ownerName}{r.ownerVerified ? " ✓" : ""}</td>
                <td className="px-3"><Badge tone={r.status === "ACTIVE" ? "success" : "neutral"}>{r.status}</Badge></td>
                <td className="px-3 tabular-nums">{formatMoney(num(r.price), r.currency)}</td>
                <td className="px-3 tabular-nums">#{Number(r.priceRank)}</td>
                <td className="px-3">{Number(r.reports) ? <Badge tone="danger">{Number(r.reports)}</Badge> : "—"}</td>
                <td className="px-5 text-right"><ModerateListing id={r.id} status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
