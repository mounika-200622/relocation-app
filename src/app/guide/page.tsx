import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Search, Sparkles } from "lucide-react";
import { Prisma } from "@prisma/client";
import { semanticSearch } from "@/lib/vector/store";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toBooleanQuery } from "@/lib/listings";
import { Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { titleCase } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Settling-in guide" };

type Hit = { id: number; slug: string; title: string; summary: string; category: string; iso: string; country: string; score: number };
type Mode = "ask" | "keyword";

/** FULLTEXT search over title, summary and body, ranked by MySQL relevance. */
async function keywordSearch(q: string): Promise<Hit[]> {
  const bq = toBooleanQuery(q);
  if (!bq) return [];
  return prisma.$queryRaw<Hit[]>`
    SELECT a.id, a.slug, a.title, a.summary, a.category, LOWER(c.isoCode) AS iso, c.name AS country,
           MATCH(a.title, a.summary, a.body) AGAINST (${bq} IN BOOLEAN MODE) AS score
    FROM GuideArticle a JOIN Country c ON c.id = a.countryId
    WHERE MATCH(a.title, a.summary, a.body) AGAINST (${bq} IN BOOLEAN MODE)
    ORDER BY score DESC LIMIT 20`;
}

/**
 * Semantic search: the question is embedded and MongoDB ranks the article vectors by cosine
 * similarity; the article rows themselves are then read from MySQL in that order.
 */
async function askSearch(q: string): Promise<Hit[]> {
  const vh = await semanticSearch("guide", q, {}, { limit: 12, minScore: 0.3 });
  if (!vh.length) return [];
  const rows = await prisma.$queryRaw<Omit<Hit, "score">[]>`
    SELECT a.id, a.slug, a.title, a.summary, a.category, LOWER(c.isoCode) AS iso, c.name AS country
    FROM GuideArticle a JOIN Country c ON c.id = a.countryId
    WHERE a.id IN (${Prisma.join(vh.map((h) => h.refId))})`;
  const byId = new Map(rows.map((r) => [r.id, r]));
  return vh.flatMap((h) => {
    const r = byId.get(h.refId);
    return r ? [{ ...r, score: h.score }] : [];
  });
}

export default async function GuideIndex({ searchParams }: { searchParams: Promise<{ q?: string; mode?: string }> }) {
  const { q, mode: rawMode } = await searchParams;
  const mode: Mode = rawMode === "keyword" ? "keyword" : "ask";
  const session = await auth();
  // countries that have any guide content, with how much (GROUP BY + HAVING)
  const countries = await prisma.$queryRaw<{ id: number; name: string; isoCode: string; flag: string | null; photoUrl: string | null; articles: bigint; checklist: bigint }[]>`
    SELECT c.id, c.name, c.isoCode, c.flag, c.photoUrl,
           (SELECT COUNT(*) FROM GuideArticle a WHERE a.countryId = c.id) AS articles,
           (SELECT COUNT(*) FROM ChecklistTemplate t WHERE t.countryId = c.id) AS checklist
    FROM Country c
    WHERE EXISTS (SELECT 1 FROM GuideArticle a WHERE a.countryId = c.id)
       OR EXISTS (SELECT 1 FROM EmergencyNumber e WHERE e.countryId = c.id)
       OR EXISTS (SELECT 1 FROM SimProvider s WHERE s.countryId = c.id)
    ORDER BY articles DESC, c.name`;

  let hits: Hit[] = [];
  let usedMode: Mode = mode;
  let notice: string | null = null;
  const query = q?.trim().slice(0, 200);
  if (query) {
    if (mode === "ask") {
      try {
        hits = await askSearch(query);
      } catch (err) {
        console.warn("[guide] semantic search unavailable:", (err as Error).message);
        notice = "Smart search isn't available right now, so these are keyword matches.";
        usedMode = "keyword";
        hits = await keywordSearch(query);
      }
    } else {
      hits = await keywordSearch(query);
    }
  }
  const dest = session?.user ? await prisma.userProfile.findUnique({ where: { userId: session.user.id }, select: { destinationCity: { select: { country: { select: { isoCode: true, name: true } } } } } }) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:px-6">
      <PageHeader eyebrow="Settling-in guide" title={<>From the very <span className="font-display italic">basics</span>.</>} description="Registration, health insurance, banking, SIM cards, transport, groceries and housing — in the order you actually need them." />

      <form className="card px-5 py-3" action="/guide">
        <div className="flex items-center gap-3">
          {mode === "ask" ? <Sparkles className="h-4 w-4 text-accent" /> : <Search className="h-4 w-4 text-subtle" />}
          <input
            name="q"
            defaultValue={q}
            placeholder={mode === "ask" ? "Ask in your own words: how do I get a phone number as a student?" : "Search the guide: deductible, Half Fare, recycling, deposit…"}
            className="h-9 min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle"
            aria-label="Search the guide"
          />
          <button type="submit" className={buttonClass("primary", "sm")}>Search</button>
        </div>
        <fieldset className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <legend className="sr-only">Search mode</legend>
          {(["ask", "keyword"] as const).map((m) => (
            <label key={m} className="cursor-pointer rounded-full border border-line px-3 py-1 transition hover:border-line-strong has-checked:border-accent has-checked:bg-accent-soft has-checked:text-fg has-focus-visible:ring-2 has-focus-visible:ring-accent">
              <input type="radio" name="mode" value={m} defaultChecked={mode === m} className="sr-only" />
              {m === "ask" ? "Ask (meaning)" : "Exact keywords"}
            </label>
          ))}
        </fieldset>
      </form>

      {q !== undefined && (
        <section className="mt-6">
          {notice && <p className="mb-3 text-sm text-muted">{notice}</p>}
          {hits.length === 0 ? (
            <EmptyState icon={<Search className="h-6 w-6" />} title={`Nothing found for “${q}”`}>
              {usedMode === "ask" ? "Try describing it differently, or switch to exact keywords." : "Try a single word like “insurance” or “SIM”, or ask in your own words."}
            </EmptyState>
          ) : (
            <ul className="card divide-y divide-line">
              {hits.map((h) => (
                <li key={h.id}>
                  <Link href={`/guide/${h.iso}/${h.slug}`} className="block px-5 py-4 hover:bg-soft">
                    <div className="flex items-center gap-2"><span className="font-medium">{h.title}</span><Badge>{titleCase(h.category)}</Badge></div>
                    <p className="mt-1 text-sm text-muted">{h.summary}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {h.country} · {usedMode === "ask" ? `${Math.round(Number(h.score) * 100)}% match` : `relevance ${Number(h.score).toFixed(2)}`}
                    </p>
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
          <Link key={c.id} href={`/guide/${c.isoCode.toLowerCase()}`} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-line-strong">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.photoUrl ? <img src={c.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-soft text-3xl">{c.flag}</span>}
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
