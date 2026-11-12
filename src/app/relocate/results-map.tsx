"use client";

import { MapPanel } from "@/components/map";
import { formatMoney } from "@/lib/format";

export function ResultsMap({ items }: { items: { id: number; lat: number; lng: number; price: number; currency: string; title: string }[] }) {
  return (
    <MapPanel
      height="100%"
      markers={items.map((i) => ({ id: i.id, lat: i.lat, lng: i.lng, kind: "price", label: formatMoney(i.price, i.currency), title: i.title, href: `/listings/${i.id}` }))}
    />
  );
}
