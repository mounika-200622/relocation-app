import { ListingCardSkeleton } from "@/components/listing-card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
      <div className="skeleton h-14 rounded-full" />
      <div className="mt-3 flex gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-9 w-28 rounded-full" />)}</div>
      <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
