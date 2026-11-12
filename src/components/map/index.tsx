"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window`, so the map is only rendered in the browser. */
export const MapPanel = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => <div className="skeleton h-full min-h-[200px] w-full rounded-2xl" />,
});

export type { MapMarker } from "@/components/map/map-view";
