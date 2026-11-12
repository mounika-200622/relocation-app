import type { PoiCategory } from "@prisma/client";

/** A place as returned by any provider, before it is cached in MySQL. */
export type RawPoi = {
  osmId: string;
  category: PoiCategory;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  openingHours: string | null;
  cuisine: string | null;
  website: string | null;
  tags: Record<string, string>;
};

/** Swappable source of places (OpenStreetMap Overpass by default, Google Places optionally). */
export interface PoiProvider {
  readonly name: string;
  search(center: { lat: number; lng: number }, radiusM: number, categories: PoiCategory[]): Promise<RawPoi[]>;
}

/** Public Overpass instances, tried in order. */
export const DEFAULT_OVERPASS = "https://overpass-api.de/api/interpreter";

export class ProviderUnavailable extends Error {}

/** Second source used when the primary provider fails (Overpass busy or down). */
export async function getFallbackProvider(): Promise<PoiProvider> {
  const { NominatimPlaceProvider } = await import("@/lib/poi/nominatim");
  return new NominatimPlaceProvider();
}

export async function getProvider(): Promise<PoiProvider> {
  if (process.env.POI_PROVIDER === "google" && process.env.GOOGLE_PLACES_API_KEY) {
    const { GooglePlacesProvider } = await import("@/lib/poi/google");
    return new GooglePlacesProvider(process.env.GOOGLE_PLACES_API_KEY);
  }
  const { OverpassProvider } = await import("@/lib/poi/overpass");
  return new OverpassProvider(process.env.OVERPASS_URL || DEFAULT_OVERPASS);
}
