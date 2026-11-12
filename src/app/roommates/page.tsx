import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Calendar, Sparkles, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { computeCompatibility } from "@/lib/matching";
import { profileSelect, toMatchProfile, topMatches } from "@/lib/roommates";
import { roommateSearchSchema } from "@/lib/validators/social";
import { formatDate, formatMoney, num, titleCase } from "@/lib/format";
import { ScoreRing } from "@/components/score-ring";
import { Avatar, Badge, EmptyState, PageHeader, SectionTitle } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { RoommateFilters } from "./filters";

export const metadata: Metadata = { title: "Roommates" };

export default async function RoommatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await pageUser(["USER", "ADMIN"]);
  const sp = await searchParams;
  const f = roommateSearchSchema.parse(sp);
  const me = await prisma.userProfile.findUnique({ where: { userId: user.id }, select: { ...profileSelect, destinationCity: { select: { name: true } } } });
  const cityId = f.cityId ?? me?.destinationCityId ?? null;

  if (!cityId) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-12">
        <EmptyState icon={<Users className="h-6 w-6" />} title="Set your destination first" action={<LinkButton href="/profile">Add destination</LinkButton>}>We show roommate seekers in the city you&apos;re moving to.</EmptyState>
      </div>
    );
  }

  const where: Prisma.RoommateRequestWhereInput = {
    status: "OPEN",
    requesterId: { not: user.id },
    listing: { cityId, status: "ACTIVE" },
    requester: {
      blocksMade: { none: { blockedId: user.id } },
      blocksReceived: { none: { blockerId: user.id } },
      ...(f.gender || f.smoking || f.pets ? { profile: { ...(f.gender ? { gender: f.gender } : {}), ...(f.smoking ? { smoking: f.smoking } : {}), ...(f.pets ? { hasPets: f.pets === "yes" } : {}) } } : {}),
    },
    ...(f.minBudget !== undefined || f.maxBudget !== undefined ? { budgetShare: { ...(f.minBudget !== undefined ? { gte: f.minBudget } : {}), ...(f.maxBudget !== undefined ? { lte: f.maxBudget } : {}) } } : {}),
    ...(f.moveInFrom || f.moveInTo ? { moveInDate: { ...(f.moveInFrom ? { gte: new Date(f.moveInFrom) } : {}), ...(f.moveInTo ? { lte: new Date(f.moveInTo) } : {}) } } : {}),
  };

  const [rows, top, city] = await Promise.all([
    prisma.roommateRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true, message: true, moveInDate: true, budgetShare: true,
        listing: { select: { id: true, title: true, currency: true, cityId: true, genderPreference: true, photos: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } },
        requester: { select: { id: true, name: true, profile: { select: profileSelect } } },
      },
    }),
    f.cityId && f.cityId !== me?.destinationCityId ? Promise.resolve([]) : topMatches(user.id, 4),
    prisma.city.findUnique({ where: { id: cityId }, select: { name: true } }),
  ]);

  const vp = toMatchProfile(me);
  const seekers = rows
    .map((r) => ({
      ...r,
      score: computeCompatibility(vp, toMatchProfile(r.requester.profile), r.listing, { otherBudget: num(r.budgetShare), otherMoveIn: r.moveInDate }).total,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6">
      <PageHeader eyebrow="Roommates" title={<>People moving to <span className="font-display italic">{city?.name}</span></>} description="Everyone here has asked to share a specific place. Scores compare budget, move-in date, gender preferences and lifestyle with your profile." />

      {top.length > 0 && (
        <section className="mb-12">
          <SectionTitle><span className="inline-flex items-center gap-2"><Sparkles className="h-5 w-5 text-warm" /> Top matches for you</span></SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {top.map((m) => (
              <Link key={m.requestId} href={`/listings/${m.listingId}#roommates`} className="card group p-5 transition hover:-translate-y-0.5 hover:border-line-strong">
                <div className="flex items-center justify-between">
                  <Avatar name={m.name} size={44} />
                  <ScoreRing score={m.score} size={50} />
                </div>
                <div className="mt-4 font-semibold">{m.name}</div>
                <div className="text-xs text-subtle">{titleCase(m.occupation)}{m.moveInDate ? ` · moves ${formatDate(m.moveInDate, { day: "numeric", month: "short" })}` : ""}</div>
                <p className="mt-3 line-clamp-2 text-sm text-muted">{m.message}</p>
                <div className="mt-3 truncate text-xs text-accent">{m.listingTitle.replace(/ · .*$/, "")}</div>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-subtle">Computed by the SQL view <code>v_roommate_compatibility</code>.</p>
        </section>
      )}

      <RoommateFilters initial={sp} />

      {seekers.length === 0 ? (
        <div className="mt-8"><EmptyState icon={<Users className="h-6 w-6" />} title="No one matches these filters">Widen the budget or move-in window.</EmptyState></div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {seekers.map((s) => (
            <li key={s.id} className="card flex gap-4 p-5">
              <Avatar name={s.requester.name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{s.requester.name}</div>
                    <div className="text-xs text-subtle">{titleCase(s.requester.profile?.occupation ?? "OTHER")}{s.requester.profile?.organization ? ` · ${s.requester.profile.organization}` : ""}</div>
                  </div>
                  <ScoreRing score={s.score} size={48} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{s.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.moveInDate && <Badge><Calendar className="h-3 w-3" />{formatDate(s.moveInDate, { day: "numeric", month: "short" })}</Badge>}
                  {s.budgetShare && <Badge><Wallet className="h-3 w-3" />{formatMoney(num(s.budgetShare), s.listing.currency)}</Badge>}
                  {s.requester.profile && <Badge>{titleCase(s.requester.profile.socialStyle)}</Badge>}
                  {s.requester.profile?.smoking === "SMOKER" && <Badge tone="warning">Smoker</Badge>}
                  {s.requester.profile?.hasPets && <Badge tone="warm">Has pets</Badge>}
                </div>
                <Link href={`/listings/${s.listing.id}#roommates`} className="mt-3 flex items-center gap-2 rounded-xl border border-line p-2 text-xs text-muted hover:text-fg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.listing.photos[0] && <img src={s.listing.photos[0].url} alt="" className="h-9 w-12 rounded-lg object-cover" />}
                  <span className="truncate">{s.listing.title}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
