import Link from "next/link";
import { BadgeCheck, BedDouble, Users } from "lucide-react";
import type { ListingCardData } from "@/lib/listings";
import { LISTING_TYPE_LABEL, formatKm, formatMoney } from "@/lib/format";
import { SaveButton } from "@/components/save-button";
import { cn } from "@/lib/cn";

/** Photo-first result card: large rounded image, heart, then 3 tight lines of facts. */
export function ListingCard({ l, budget, showSave = true, className, priority }: { l: ListingCardData; budget?: { amount: number; currency: string } | null; showSave?: boolean; className?: string; priority?: boolean }) {
  const withinBudget = budget && budget.currency === l.currency && l.price <= budget.amount;
  return (
    <Link href={`/listings/${l.id}`} className={cn("group block animate-fade-up", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-soft">
        {l.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.coverUrl} alt={l.title} loading={priority ? "eager" : "lazy"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="grid h-full place-items-center text-subtle text-sm">No photo yet</div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {withinBudget && <span className="rounded-full bg-success/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow">Within budget</span>}
            {l.isShareable && l.spotsLeft > 0 && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-black shadow">{l.spotsLeft} spot{l.spotsLeft > 1 ? "s" : ""} left</span>}
          </div>
          {showSave && <SaveButton listingId={l.id} initial={Boolean(l.saved)} />}
        </div>
        {l.photoCount > 1 && (
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1">
            {Array.from({ length: Math.min(5, l.photoCount) }).map((_, i) => (
              <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-white" : "bg-white/50")} />
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">{l.cityName}{l.regionName && l.regionName !== l.cityName ? `, ${l.regionName}` : ""}</h3>
          <p className="truncate text-sm text-muted">{l.title.replace(/ · .*$/, "")}</p>
        </div>
        <span className="mt-0.5 shrink-0 rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-muted">{LISTING_TYPE_LABEL[l.type] ?? l.type}</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[13px] text-subtle">
        <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{l.bedrooms} bd</span>
        {l.isShareable && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />Shareable</span>}
        {l.ownerVerified && <span className="inline-flex items-center gap-1 text-accent"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
        {l.distanceKm !== null && <span>{formatKm(l.distanceKm)}</span>}
      </div>
      <p className="mt-1.5 text-[15px]">
        <span className="font-semibold">{formatMoney(l.price, l.currency)}</span>
        <span className="text-muted"> / month</span>
      </p>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/3] rounded-2xl" />
      <div className="skeleton mt-3 h-4 w-2/3" />
      <div className="skeleton mt-2 h-3.5 w-1/2" />
      <div className="skeleton mt-2 h-4 w-1/3" />
    </div>
  );
}
