import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toBooleanQuery } from "@/lib/listings";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { titleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Settling-in guide" };

type Hit = { id: number; slug: string; title: string; summary: string; category: string; iso: string; country: string; score: number };

export default async function GuideIndex({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const session = await auth();
  // countries that have any guide content, with how much (GROUP BY + HAVING)
  const countries = await prisma.$queryRaw<{ id: number; name: string; isoCode: string; flag: string | null; articles: bigint; checklist: bigint }[]>`
    SELECT c.id, c.name, c.isoCode, c.flag,
           (SELECT COUNT(*) FROM GuideArticle a WHERE a.countryId = c.id) AS articles,
           (SELECT COUNT(*) FROM ChecklistTemplate t WHERE t.countryId = c.id) AS checklist
    FROM Country c
    WHERE EXISTS (SELECT 1 FROM GuideArticle a WHERE a.countryId = c.id)
       OR EXISTS (SELECT 1 FROM EmergencyNumber e WHERE e.countryId = c.id)
       OR EXISTS (SELECT 1 FROM SimProvider s WHERE s.countryId = c.id)
    ORDER BY articles DESC, c.name`;

  let hits: Hit[] = [];
  const bq = q ? toBooleanQuery(q) : null;
  if (bq) {
    // FULLTEXT search over title, summary and body, ranked by relevance
    hits = await prisma.$queryRaw<Hit[]>`
      SELECT a.id, a.slug, a.title, a.summary, a.category, LOWER(c.isoCode) AS iso, c.name AS country,
             MATCH(a.title, a.summary, a.body) AGAINST (${bq} IN BOOLEAN MODE) AS score
      FROM GuideArticle a JOIN Country c ON c.id = a.countryId
      WHERE MATCH(a.title, a.summary, a.body) AGAINST (${bq} IN BOOLEAN MODE)
      ORDER BY score DESC LIMIT 20`;
  }
  const dest = session?.user ? await prisma.userProfile.findUnique({ where: { userId: session.user.id }, select: { destinationCity: { select: { country: { select: { isoCode: true, name: true } } } } } }) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:px-6">
      <PageHeader eyebrow="Settling-in guide" title={<>From the very <span className="font-display italic">basics</span>.</>} description="Registration, health insurance, banking, SIM cards, transport, groceries and housing — in the order you actually need them." />

      <form className="card flex items-center gap-3 px-5 py-3" action="/guide">
        <Search className="h-4 w-4 text-subtle" />
        <input name="q" defaultValue={q} placeholder="Search the guide: deductible, Half Fare, recycling, deposit…" className="h-9 flex-1 bg-transparent outline-none placeholder:text-subtle" aria-label="Search the guide" />
      </form>

      {q !== undefined && (
        <section className="mt-6">
          {hits.length === 0 ? (
            <EmptyState icon={<Search className="h-6 w-6" />} title={`Nothing found for “${q}”`}>Try a single word like “insurance” or “SIM”.</EmptyState>
          ) : (
            <ul className="card divide-y divide-line">
              {hits.map((h) => (
                <li key={h.id}>
                  <Link href={`/guide/${h.iso}/${h.slug}`} className="block px-5 py-4 hover:bg-soft">
                    <div className="flex items-center gap-2"><span className="font-medium">{h.title}</span><Badge>{titleCase(h.category)}</Badge></div>
                    <p className="mt-1 text-sm text-muted">{h.summary}</p>
                    <p className="mt-1 text-xs text-subtle">{h.country} · relevance {Number(h.score).toFixed(2)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {dest?.destinationCity && (
        <Link href={`/guide/${dest.destinationCity.country.isoCode.toLowerCase()}`} className="mt-8 flex items-center justify-between rounded-3xl bg-accent-strong p-6 text-white shadow-xl">
          <span><span className="block text-sm opacity-80">Your destination</span><span className="text-2xl font-semibold">{dest.destinationCity.country.name} guide</span></span>
          <ArrowRight className="h-6 w-6" />
        </Link>
      )}

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Choose a country</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((c) => (
          <Link key={c.id} href={`/guide/${c.isoCode.toLowerCase()}`} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-line-strong">
            <span className="text-3xl">{c.flag}</span>
            <span className="flex-1">
              <span className="block font-semibold">{c.name}</span>
              <span className="text-xs text-subtle">{Number(c.articles) ? `${Number(c.articles)} articles · ${Number(c.checklist)} checklist steps` : "SIM cards, transport, ride apps & emergency numbers"}</span>
            </span>
            {Number(c.articles) > 0 && <BookOpen className="h-4 w-4 text-accent" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
