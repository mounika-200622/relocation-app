import type { PoiCategory } from "@prisma/client";
import { ProviderUnavailable, type PoiProvider, type RawPoi } from "@/lib/poi/provider";

/** Our categories → Google Places (New) primary types. */
const TYPES: Partial<Record<PoiCategory, string[]>> = {
  RESTAURANT: ["restaurant"], CAFE: ["cafe"], FAST_FOOD: ["fast_food_restaurant"], SUPERMARKET: ["supermarket", "grocery_store"],
  CONVENIENCE: ["convenience_store"], HOSPITAL: ["hospital"], PHARMACY: ["pharmacy"], DOCTOR: ["doctor"], BANK: ["bank"], ATM: ["atm"],
  TRANSIT: ["transit_station", "bus_stop", "train_station", "subway_station"], MOBILE_SHOP: ["cell_phone_store"], LAUNDRY: ["laundry"],
  GYM: ["gym"], UNIVERSITY: ["university"], POST_OFFICE: ["post_office"], POLICE: ["police"], HOTEL: ["hotel"], HOSTEL: ["hostel"],
  GUEST_HOUSE: ["guest_house"], CAMP_SITE: ["campground"], ATTRACTION: ["tourist_attraction"], MUSEUM: ["museum"], GALLERY: ["art_gallery"],
  HISTORIC: ["historical_landmark"], PARK: ["park"], NIGHTLIFE: ["bar", "night_club"], SHOPPING: ["shopping_mall"],
};

type Place = { id: string; displayName?: { text: string }; location: { latitude: number; longitude: number }; formattedAddress?: string; websiteUri?: string; priceLevel?: string; primaryType?: string };

/** Optional provider behind POI_PROVIDER=google – same interface as Overpass. */
export class GooglePlacesProvider implements PoiProvider {
  readonly name = "google";
  constructor(private key: string) {}

  async search(center: { lat: number; lng: number }, radiusM: number, categories: PoiCategory[]): Promise<RawPoi[]> {
    const out: RawPoi[] = [];
    for (const category of categories) {
      const includedTypes = TYPES[category];
      if (!includedTypes) continue;
      const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.key,
          "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.priceLevel,places.primaryType",
        },
        body: JSON.stringify({ includedTypes, maxResultCount: 20, locationRestriction: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: Math.min(radiusM, 50_000) } } }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new ProviderUnavailable(`Google Places ${res.status}`);
      const data = (await res.json()) as { places?: Place[] };
      for (const p of data.places ?? []) {
        const tags: Record<string, string> = { source: "google" };
        if (p.priceLevel) tags.google_price_level = p.priceLevel;
        out.push({
          osmId: `google/${p.id}`.slice(0, 64), category, name: p.displayName?.text ?? "Unnamed place", lat: p.location.latitude, lng: p.location.longitude,
          address: p.formattedAddress ?? null, openingHours: null, cuisine: null, website: p.websiteUri ?? null, tags,
        });
      }
    }
    return out;
  }
}
