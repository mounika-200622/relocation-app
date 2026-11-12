import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { Building2, Database, Flag, MessageCircle, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { messageCount, messagesPerDay } from "@/lib/mongo/chat";
import { formatMoney, relativeTime } from "@/lib/format";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [roles, listingsByStatus, openReports, cityStats, audit, msgs, perDay, cache] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.listing.groupBy({ by: ["status"], _count: true }),
    prisma.report.count({ where: { status: "OPEN" } }),
    // JOIN + GROUP BY + HAVING + window function: cities ranked by active listings and average price
    prisma.$queryRaw<{ city: string; country: string; listings: bigint; avgPrice: Prisma.Decimal; currency: string; rnk: bigint }[]>`
      SELECT c.name AS city, co.name AS country, COUNT(*) AS listings, AVG(l.price) AS avgPrice, MIN(l.currency) AS currency,
             RANK() OVER (ORDER BY COUNT(*) DESC) AS rnk
      FROM Listing l JOIN City c ON c.id = l.cityId JOIN Country co ON co.id = c.countryId
      WHERE l.status = 'ACTIVE'
      GROUP BY c.id, c.name, co.name
      HAVING COUNT(*) >= 1
      ORDER BY listings DESC LIMIT 8`,
    prisma.auditLog.findMany({ orderBy: { changedAt: "desc" }, take: 12 }),
    messageCount().catch(() => null),
    messagesPerDay(14).catch(() => []),
    prisma.poiQueryCache.groupBy({ by: ["category"], _sum: { resultCount: true }, _count: true, orderBy: { _sum: { resultCount: "desc" } }, take: 10 }),
  ]);
  const peak = Math.max(1, ...perDay.map((d) => d.messages));

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Overview" description="Live numbers from MySQL (SQL aggregates, views, triggers) and MongoDB (aggregation pipelines)." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={roles.reduce((s, r) => s + r._count, 0)} hint={roles.map((r) => `${r._count} ${r.role.toLowerCase()}`).join(" · ")} icon={<Users className="h-4 w-4" />} />
        <Stat label="Listings" value={listingsByStatus.reduce((s, r) => s + r._count, 0)} hint={listingsByStatus.map((r) => `${r._count} ${r.status.toLowerCase()}`).join(" · ")} icon={<Building2 className="h-4 w-4" />} />
        <Stat label="Open reports" value={openReports} icon={<Flag className="h-4 w-4" />} />
        <Stat label="Chat messages (MongoDB)" value={msgs ?? "offline"} icon={<MessageCircle className="h-4 w-4" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <SectionTitle>Top cities</SectionTitle>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-subtle"><tr><th className="pb-2">#</th><th className="pb-2">City</th><th className="pb-2 text-right">Listings</th><th className="pb-2 text-right">Avg price</th></tr></thead>
            <tbody className="divide-y divide-line">
              {cityStats.map((c) => (
                <tr key={c.city}><td className="py-2 text-subtle">{Number(c.rnk)}</td><td className="py-2">{c.city}<span className="text-subtle">, {c.country}</span></td><td className="py-2 text-right tabular-nums">{Number(c.listings)}</td><td className="py-2 text-right tabular-nums">{formatMoney(Number(c.avgPrice), c.currency)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-6">
          <SectionTitle>Messages per day (MongoDB $group)</SectionTitle>
          {perDay.length === 0 ? (
            <p className="text-sm text-muted">No messages in the last 14 days.</p>
          ) : (
            <div className="flex h-40 items-end gap-1.5">
              {perDay.map((d) => (
                <div key={d._id} className="group relative flex flex-1 flex-col items-center justify-end" title={`${d._id}: ${d.messages} messages from ${d.senders} people`}>
                  <div className="w-full rounded-t-md bg-warm/80" style={{ height: `${Math.max(6, (d.messages / peak) * 100)}%` }} />
                  <span className="mt-1 text-[10px] text-subtle">{d._id.slice(8)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <SectionTitle>Audit log (trigger trg_listing_audit_au)</SectionTitle>
          {audit.length === 0 ? <p className="text-sm text-muted">No price or status changes yet.</p> : (
            <ul className="divide-y divide-line text-sm">
              {audit.map((a) => {
                const o = a.oldValue as { price?: string; status?: string } | null;
                const n = a.newValue as { price?: string; status?: string } | null;
                return (
                  <li key={String(a.id)} className="flex items-center justify-between gap-3 py-2">
                    <span>{a.tableName} #{a.rowId}: {o?.status !== n?.status ? `${o?.status} → ${n?.status}` : `price ${o?.price} → ${n?.price}`}</span>
                    <span className="shrink-0 text-xs text-subtle">{relativeTime(a.changedAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <SectionTitle><span className="inline-flex items-center gap-2"><Database className="h-4 w-4" /> Place cache</span></SectionTitle>
          {cache.length === 0 ? <p className="text-sm text-muted">No places cached yet.</p> : (
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {cache.map((c) => <li key={c.category} className="flex justify-between rounded-lg bg-soft px-3 py-2"><span>{c.category.toLowerCase().replace(/_/g, " ")}</span><span className="tabular-nums text-muted">{c._sum.resultCount ?? 0}</span></li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
