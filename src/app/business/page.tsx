import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Building2, Eye, Inbox, MessageCircle, Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { LISTING_TYPE_LABEL, formatMoney, num } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Stat } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ListingRowActions } from "./row-actions";

export const metadata: Metadata = { title: "Business dashboard" };
export const dynamic = "force-dynamic";

type Row = {
  id: number; title: string; type: string; status: string; price: Prisma.Decimal; currency: string; cityName: string; coverUrl: string | null;
  capacityMax: number; currentOccupants: number; isShareable: number; views: bigint; views7: bigint; openRequests: bigint; inquiries: bigint;
};

export default async function BusinessDashboard() {
  const user = await pageUser(["BUSINESS"]);
  // One query, aggregates via correlated sub-queries on the view (JOIN + COUNT + date filter)
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT v.id, v.title, v.type, v.status, v.price, v.currency, v.cityName, v.coverUrl, v.capacityMax, v.currentOccupants, v.isShareable,
           (SELECT COUNT(*) FROM ListingView lv WHERE lv.listingId = v.id) AS views,
           (SELECT COUNT(*) FROM ListingView lv WHERE lv.listingId = v.id AND lv.viewedOn >= CURDATE() - INTERVAL 7 DAY) AS views7,
           v.openRequests,
           (SELECT COUNT(*) FROM Conversation c WHERE c.listingId = v.id) AS inquiries
    FROM v_listing_summary v
    WHERE v.ownerId = ${user.id}
    ORDER BY FIELD(v.status, 'ACTIVE', 'RENTED', 'ARCHIVED'), v.createdAt DESC`;

  // views per day for the last 14 days (GROUP BY on a date)
  const daily = await prisma.$queryRaw<{ day: Date; n: bigint }[]>`
    SELECT lv.viewedOn AS day, COUNT(*) AS n
    FROM ListingView lv JOIN Listing l ON l.id = lv.listingId
    WHERE l.ownerId = ${user.id} AND lv.viewedOn >= CURDATE() - INTERVAL 13 DAY
    GROUP BY lv.viewedOn ORDER BY lv.viewedOn`;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10);
    return { d, n: Number(daily.find((x) => x.day.toISOString().slice(0, 10) === d)?.n ?? 0) };
  });
  const peak = Math.max(1, ...days.map((d) => d.n));
  const totals = rows.reduce((t, r) => ({ views: t.views + Number(r.views), inquiries: t.inquiries + Number(r.inquiries), requests: t.requests + Number(r.openRequests) }), { views: 0, inquiries: 0, requests: 0 });
  const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id }, select: { displayName: true, isVerified: true } });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      <PageHeader
        eyebrow={profile?.isVerified ? "Verified business" : "Business"}
        title={profile?.displayName ?? user.name}
        description="Your places, their performance and everyone who wants to live in them."
        actions={<><LinkButton href="/chat" variant="secondary"><Inbox className="h-4 w-4" /> Inbox</LinkButton><LinkButton href="/business/listings/new"><Plus className="h-4 w-4" /> New listing</LinkButton></>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Listings" value={rows.length} hint={`${rows.filter((r) => r.status === "ACTIVE").length} active`} icon={<Building2 className="h-4 w-4" />} />
        <Stat label="Total views" value={totals.views} hint="unique visitors per day" icon={<Eye className="h-4 w-4" />} />
        <Stat label="Inquiries" value={totals.inquiries} hint="conversations started" icon={<MessageCircle className="h-4 w-4" />} />
        <Stat label="Open roommate requests" value={totals.requests} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Views, last 14 days</h2>
          <span className="text-sm text-subtle">{days.reduce((s, d) => s + d.n, 0)} total</span>
        </div>
        <div className="mt-6 flex h-36 items-end gap-1.5" role="img" aria-label="Bar chart of daily views">
          {days.map((d) => (
            <div key={d.d} className="group relative flex flex-1 flex-col items-center justify-end">
              <span className="absolute -top-6 hidden rounded bg-fg px-1.5 py-0.5 text-[10px] text-bg group-hover:block">{d.n}</span>
              <div className="w-full rounded-t-md bg-accent-strong/80 transition group-hover:bg-accent-strong" style={{ height: `${Math.max(4, (d.n / peak) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-subtle"><span>{days[0]!.d.slice(5)}</span><span>today</span></div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Your listings</h2>
        {rows.length === 0 ? (
          <EmptyState icon={<Building2 className="h-6 w-6" />} title="No listings yet" action={<LinkButton href="/business/listings/new">Create your first listing</LinkButton>}>It takes about three minutes.</EmptyState>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle">
                <tr><th className="px-5 py-3 font-medium">Place</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Price</th><th className="px-3 py-3 font-medium">Occupancy</th><th className="px-3 py-3 font-medium">Views (7d)</th><th className="px-3 py-3 font-medium">Requests</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-soft/50">
                    <td className="px-5 py-3">
                      <Link href={`/listings/${r.id}`} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {r.coverUrl ? <img src={r.coverUrl} alt="" className="h-12 w-16 rounded-lg object-cover" /> : <span className="h-12 w-16 rounded-lg bg-soft" />}
                        <span className="min-w-0"><span className="block max-w-xs truncate font-medium">{r.title}</span><span className="text-xs text-subtle">{LISTING_TYPE_LABEL[r.type]} · {r.cityName}</span></span>
                      </Link>
                    </td>
                    <td className="px-3"><Badge tone={r.status === "ACTIVE" ? "success" : r.status === "RENTED" ? "warm" : "neutral"}>{r.status}</Badge></td>
                    <td className="px-3 tabular-nums">{formatMoney(num(r.price), r.currency)}</td>
                    <td className="px-3 tabular-nums">{r.isShareable ? `${r.currentOccupants}/${r.capacityMax}` : "—"}</td>
                    <td className="px-3 tabular-nums">{Number(r.views7)} <span className="text-subtle">/ {Number(r.views)}</span></td>
                    <td className="px-3">{Number(r.openRequests) > 0 ? <Link href={`/business/listings/${r.id}/requests`} className="font-medium text-accent hover:underline">{Number(r.openRequests)} open</Link> : <span className="text-subtle">—</span>}</td>
                    <td className="px-5 text-right"><ListingRowActions id={r.id} status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
