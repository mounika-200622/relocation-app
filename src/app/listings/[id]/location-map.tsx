"use client";

import { MapPanel } from "@/components/map";

export function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  return <MapPanel height="100%" center={[lat, lng]} markers={[{ id: "home", lat, lng, kind: "home", label: "★" }]} />;
}
