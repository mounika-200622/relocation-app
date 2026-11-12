import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, titleCase } from "@/lib/format";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/misc";

type Props = { params: Promise<{ country: string; slug: string }> };

async function load(p: { country: string; slug: string }) {
  if (!/^[a-z]{2}$/i.test(p.country) || !/^[a-z0-9-]{1,120}$/.test(p.slug)) return null;
  return prisma.guideArticle.findFirst({ where: { slug: p.slug, country: { isoCode: p.country.toUpperCase() } }, include: { country: { select: { name: true, flag: true, isoCode: true } } } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await load(await params);
  return a ? { title: a.title, description: a.summary } : { title: "Article not found" };
}

export default async function ArticlePage({ params }: Props) {
  const a = await load(await params);
  if (!a) notFound();
  const more = await prisma.guideArticle.findMany({ where: { countryId: a.countryId, id: { not: a.id } }, orderBy: { position: "asc" }, take: 4, select: { slug: true, title: true } });
  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-8">
      <Link href={`/guide/${a.country.isoCode.toLowerCase()}`} className="text-sm text-muted hover:text-fg">← {a.country.flag} {a.country.name} guide</Link>
      <div className="mt-6"><Badge tone="accent">{titleCase(a.category)}</Badge></div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">{a.title}</h1>
      <p className="mt-4 text-lg text-muted">{a.summary}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-b border-line pb-6 text-xs text-subtle">
        <span>Last updated {formatDate(a.updatedAt)}</span>
        {a.sourceName && <span>Source: {a.sourceUrl ? <a href={a.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">{a.sourceName} <ExternalLink className="h-3 w-3" /></a> : a.sourceName}</span>}
      </div>
      <div className="mt-8 text-[16.5px]"><Markdown source={a.body} /></div>
      {more.length > 0 && (
        <aside className="mt-14 border-t border-line pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Keep reading</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {more.map((m) => <li key={m.slug}><Link href={`/guide/${a.country.isoCode.toLowerCase()}/${m.slug}`} className="card block p-4 font-medium hover:border-line-strong">{m.title}</Link></li>)}
          </ul>
        </aside>
      )}
    </article>
  );
}
