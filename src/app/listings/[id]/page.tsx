import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Bath, BedDouble, CalendarDays, Check, Cigarette, Dog, Home, Info, Ruler, Sofa, TrendingDown, Users, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LISTING_TYPE_LABEL, PREFERENCE_LABEL, formatDate, formatMoney, num } from "@/lib/format";
import { priceRankInCity } from "@/lib/listings";
import { requestsForListing } from "@/lib/roommates";
import { Gallery } from "@/components/gallery";
import { SaveButton } from "@/components/save-button";
import { MessageOwnerButton, ReportButton, ShareButton, ViewTracker } from "@/components/listing/contact-actions";
import { RoommateSection } from "@/components/listing/roommate-section";
import { EssentialsPanel } from "@/components/essentials-panel";
import { LocationMap } from "./location-map";
import { Avatar, Badge, Progress } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

type Props = { params: Promise<{ id: string }> };

async function load(idRaw: string) {
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return prisma.listing.findUnique({
    where: { id },
    select: {
      id: true, ownerId: true, title: true, description: true, type: true, status: true, address: true, lat: true, lng: true, price: true, deposit: true,
      currency: true, bedrooms: true, bathrooms: true, sizeSqm: true, furnished: true, availableFrom: true, minStayMonths: true, utilitiesIncluded: true,
      billsEstimate: true, petsAllowed: true, smokingAllowed: true, guestsAllowed: true, isShareable: true, capacityMin: true, capacityMax: true,
      currentOccupants: true, genderPreference: true, createdAt: true, cityId: true,
      city: { select: { name: true, region: { select: { name: true } }, country: { select: { name: true, isoCode: true } } } },
      photos: { orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true, url: true, caption: true } },
      amenities: { select: { amenity: { select: { code: true, label: true } } } },
      owner: { select: { name: true, createdAt: true, businessProfile: { select: { displayName: true, description: true, isVerified: true } }, _count: { select: { listings: true } } } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await load((await params).id);
  return l ? { title: l.title, description: l.description?.slice(0, 160) ?? undefined } : { title: "Listing not found" };
}

export default async function ListingPage({ params }: Props) {
  const l = await load((await params).id);
  if (!l) notFound();
  const session = await auth();
  const viewer = session?.user ?? null;
  const isOwner = viewer?.id === l.ownerId;
  const [saved, rank, requests] = await Promise.all([
    viewer ? prisma.savedListing.findUnique({ where: { userId_listingId: { userId: viewer.id, listingId: l.id } } }) : null,
    priceRankInCity(l.id),
    l.isShareable ? requestsForListing(l.id, viewer?.id ?? null) : Promise.resolve([]),
  ]);
  const price = num(l.price)!;
  const spotsLeft = Math.max(0, l.capacityMax - l.currentOccupants);
  const ownerName = l.owner.businessProfile?.displayName ?? l.owner.name;
  const location = [l.city.name, l.city.region?.name, l.city.country.name].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6">
      <ViewTracker listingId={l.id} />
      {l.status !== "ACTIVE" && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <Info className="h-4 w-4" /> This place is {l.status === "RENTED" ? "rented / full" : "archived"} and not taking new requests.
        </div>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{LISTING_TYPE_LABEL[l.type]}</Badge>
            {l.isShareable && <Badge tone="success">Shareable · {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left</Badge>}
            {l.genderPreference !== "ANYONE" && <Badge tone="warm">{PREFERENCE_LABEL[l.genderPreference]}</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-4xl">{l.title}</h1>
          <p className="mt-1.5 text-muted">{l.address} · {location}</p>
        </div>
        <div className="flex gap-2">
          <ShareButton title={l.title} />
          {viewer?.role !== "BUSINESS" && <SaveButton listingId={l.id} initial={Boolean(saved)} variant="pill" />}
          {isOwner && <LinkButton href={`/business/listings/${l.id}/edit`} variant="secondary">Edit</LinkButton>}
        </div>
      </div>

      <div className="mt-6"><Gallery photos={l.photos} title={l.title} /></div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-12">
          {/* owner strip */}
          <div className="flex items-center gap-4 border-b border-line pb-8">
            <Avatar name={ownerName} size={52} />
            <div>
              <div className="flex items-center gap-2 font-semibold">{ownerName} {l.owner.businessProfile?.isVerified && <BadgeCheck className="h-4 w-4 text-accent" aria-label="Verified" />}</div>
              <div className="text-sm text-subtle">{l.owner._count.listings} listing{l.owner._count.listings === 1 ? "" : "s"} on Nira · member since {formatDate(l.owner.createdAt, { month: "long", year: "numeric" })}</div>
            </div>
          </div>

          {/* key facts */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fact icon={<BedDouble />} label="Bedrooms" value={l.bedrooms} />
            <Fact icon={<Bath />} label="Bathrooms" value={l.bathrooms} />
            <Fact icon={<Ruler />} label="Size" value={l.sizeSqm ? `${l.sizeSqm} m²` : "—"} />
            <Fact icon={<Sofa />} label="Furnished" value={l.furnished ? "Yes" : "No"} />
            <Fact icon={<CalendarDays />} label="Available" value={l.availableFrom ? formatDate(l.availableFrom) : "Now"} />
            <Fact icon={<Home />} label="Minimum stay" value={`${l.minStayMonths} month${l.minStayMonths > 1 ? "s" : ""}`} />
            <Fact icon={<Users />} label="Capacity" value={`${l.currentOccupants}/${l.capacityMax} living`} />
            <Fact icon={<Info />} label="Utilities" value={l.utilitiesIncluded ? "Included" : "Extra"} />
          </div>

          {l.description && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">About this place</h2>
              <div className="mt-3 whitespace-pre-line leading-relaxed text-muted">{l.description}</div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold tracking-tight">What this place offers</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {l.amenities.map((a) => (
                <li key={a.amenity.code} className="flex items-center gap-3 text-[15px]"><Check className="h-4 w-4 text-success" />{a.amenity.label}</li>
              ))}
            </ul>
            <h3 className="mt-8 font-semibold">House rules</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              <Rule ok={l.petsAllowed} icon={<Dog className="h-4 w-4" />} label="Pets" />
              <Rule ok={l.smokingAllowed} icon={<Cigarette className="h-4 w-4" />} label="Smoking" />
              <Rule ok={l.guestsAllowed} icon={<Users className="h-4 w-4" />} label="Overnight guests" />
            </ul>
          </section>

          {rank && rank.cityCount > 1 && (
            <section className="card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold"><TrendingDown className="h-4 w-4 text-success" /> Price insight</div>
              <p className="mt-2 text-[15px] text-muted">
                This place is cheaper than <b className="text-fg">{100 - rank.percentile}%</b> of the {rank.cityCount} active places in {l.city.name}. The city average is{" "}
                <b className="text-fg">{formatMoney(rank.cityAvg, l.currency)}</b>.
              </p>
              <Progress value={100 - rank.percentile} tone="success" className="mt-4" />
            </section>
          )}

          {l.lat !== null && l.lng !== null && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">Where you&apos;ll be</h2>
              <p className="mt-1 text-sm text-muted">{location}</p>
              <div className="mt-4 h-80 overflow-hidden rounded-3xl border border-line"><LocationMap lat={l.lat} lng={l.lng} /></div>
            </section>
          )}

          {l.isShareable && (
            <RoommateSection
              listingId={l.id}
              ownerId={l.ownerId}
              requests={requests}
              canRequest={l.status === "ACTIVE" && spotsLeft > 0}
              spotsLeft={spotsLeft}
              currency={l.currency}
              suggestedShare={Math.round(price / Math.max(2, l.capacityMax))}
            />
          )}

          {l.lat !== null && l.lng !== null && <EssentialsPanel lat={l.lat} lng={l.lng} cityId={l.cityId} />}

          <div className="flex justify-end border-t border-line pt-6"><ReportButton listingId={l.id} /></div>
        </div>

        {/* sticky action card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight">{formatMoney(price, l.currency)}</span>
              <span className="text-muted">/ month</span>
            </div>
            <dl className="mt-5 divide-y divide-line rounded-2xl border border-line text-sm">
              <Row label="Deposit" value={formatMoney(num(l.deposit), l.currency)} />
              <Row label="Bills" value={l.utilitiesIncluded ? "Included" : l.billsEstimate ? `~${formatMoney(num(l.billsEstimate), l.currency)}/mo` : "Ask the owner"} />
              <Row label="Available from" value={l.availableFrom ? formatDate(l.availableFrom) : "Now"} />
              {l.isShareable && <Row label="Your share (est.)" value={`${formatMoney(Math.round(price / Math.max(1, l.currentOccupants + 1)), l.currency)}/mo`} />}
            </dl>
            <div className="mt-5 space-y-2.5">
              {!isOwner && <MessageOwnerButton listingId={l.id} ownerId={l.ownerId} className="w-full" />}
              {l.isShareable && !isOwner && <LinkButton href="#roommates" variant="secondary" size="lg" className="w-full">See who wants to share</LinkButton>}
              {isOwner && <LinkButton href={`/business/listings/${l.id}/requests`} size="lg" className="w-full">Manage requests</LinkButton>}
            </div>
            <p className="mt-4 text-center text-xs text-subtle">Never pay before viewing. Keep all contact inside Nira.</p>
          </div>
          <Link href={`/guide/${l.city.country.isoCode.toLowerCase()}`} className="mt-4 block rounded-2xl border border-line p-4 text-sm text-muted hover:border-line-strong hover:text-fg">
            New to {l.city.country.name}? Read the settling-in guide →
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line p-4">
      <span className="text-subtle [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <div className="mt-3 text-xs text-subtle">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function Rule({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-sm">
      {icon}
      <span className="flex-1">{label}</span>
      {ok ? <Check className="h-4 w-4 text-success" aria-label="allowed" /> : <X className="h-4 w-4 text-danger" aria-label="not allowed" />}
    </li>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
