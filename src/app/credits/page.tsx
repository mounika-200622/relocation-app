import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseCredit } from "@/components/photo-credit";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Photo credits" };
export const dynamic = "force-dynamic";

/** Attribution for every third-party photo used in the app (all from Wikimedia Commons). */
export default async function CreditsPage() {
  const [listingPhotos, cities, countries] = await Promise.all([
    prisma.listingPhoto.findMany({ where: { credit: { not: null } }, distinct: ["url"], select: { url: true, credit: true }, orderBy: { url: "asc" } }),
    prisma.city.findMany({ where: { photoCredit: { not: null } }, select: { name: true, photoUrl: true, photoCredit: true }, orderBy: { name: "asc" } }),
    prisma.country.findMany({ where: { photoCredit: { not: null } }, select: { name: true, photoUrl: true, photoCredit: true }, orderBy: { name: "asc" } }),
  ]);
  const rows = [
    ...countries.map((c) => ({ label: c.name, url: c.photoUrl!, credit: c.photoCredit })),
    ...cities.map((c) => ({ label: c.name, url: c.photoUrl!, credit: c.photoCredit })),
    ...listingPhotos.map((p) => ({ label: "Demo listing photo", url: p.url, credit: p.credit })),
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">
      <PageHeader title="Photo credits" description="Demo photos are real photographs from Wikimedia Commons, used under their free licences (CC0, public domain, CC BY, CC BY-SA, FAL). Photos uploaded by owners belong to them." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => {
          const c = parseCredit(r.credit);
          if (!c) return null;
          return (
            <li key={r.url} className="card flex items-center gap-4 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 text-sm">
                <div className="font-medium">{r.label}</div>
                <div className="truncate text-xs text-muted">{c.title}</div>
                <div className="text-xs text-subtle">
                  {c.author} · {c.license} · {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">source</a> : "Wikimedia Commons"}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
