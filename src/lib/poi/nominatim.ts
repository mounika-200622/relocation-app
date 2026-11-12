import type { PoiCategory } from "@prisma/client";
import { classify } from "@/lib/poi/categories";
import { boundingBox, haversineKm } from "@/lib/geo";
import { nominatimThrottle } from "@/lib/geocode";
import { ProviderUnavailable, type PoiProvider, type RawPoi } from "@/lib/poi/provider";

/** OpenStreetMap "special phrases" Nominatim understands, per category. */
const PHRASES: Record<PoiCategory, string[]> = {
  RESTAURANT: ["restaurant"], CAFE: ["cafe"], FAST_FOOD: ["fast food"], SUPERMARKET: ["supermarket"], CONVENIENCE: ["convenience store"],
  HOSPITAL: ["hospital"], CLINIC: ["clinic"], PHARMACY: ["pharmacy"], DOCTOR: ["doctors"], BANK: ["bank"], ATM: ["atm"],
  CURRENCY_EXCHANGE: ["bureau de change"], TRANSIT: ["bus stop", "subway station", "railway station"], MOBILE_SHOP: ["mobile phone shop"],
  LAUNDRY: ["laundry"], GYM: ["fitness centre"], UNIVERSITY: ["university", "college"], POST_OFFICE: ["post office"], POLICE: ["police"],
  HOTEL: ["hotel"], HOSTEL: ["hostel"], GUEST_HOUSE: ["guest house"], CAMP_SITE: ["camp site"], ATTRACTION: ["tourist attraction"],
  MUSEUM: ["museum"], VIEWPOINT: ["viewpoint"], GALLERY: ["art gallery"], HISTORIC: ["monument", "castle"], PARK: ["park"],
  NIGHTLIFE: ["bar", "pub"], SHOPPING: ["mall", "marketplace"],
};

type Hit = { osm_type: string; osm_id: number; lat: string; lon: string; name: string; category: string; type: string; extratags?: Record<string, string> | null; address?: Record<string, string> };

/**
 * Fallback place source when the Overpass API is down or overloaded: Nominatim search
 * restricted to the search area. Same usage policy as geocoding (1 req/s, User-Agent).
 */
export class NominatimPlaceProvider implements PoiProvider {
  readonly name = "nominatim";

  async search(center: { lat: number; lng: number }, radiusM: number, categories: PoiCategory[]): Promise<RawPoi[]> {
    const box = boundingBox(center, radiusM / 1000);
    const seen = new Set<string>();
    const out: RawPoi[] = [];
    for (const category of categories) {
      for (const phrase of PHRASES[category]) {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", phrase);
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "50");
        url.searchParams.set("bounded", "1");
        url.searchParams.set("viewbox", `${box.minLng},${box.maxLat},${box.maxLng},${box.minLat}`);
        url.searchParams.set("extratags", "1");
        url.searchParams.set("addressdetails", "1");
        const hits = await nominatimThrottle(async () => {
          const res = await fetch(url, { headers: { "User-Agent": process.env.NOMINATIM_USER_AGENT || "Nira-Student-Project/1.0", "Accept-Language": "en" }, signal: AbortSignal.timeout(12_000) });
          if (!res.ok) throw new ProviderUnavailable(`Nominatim ${res.status}`);
          return (await res.json()) as Hit[];
        });
        for (const h of hits) {
          const osmId = `${h.osm_type}/${h.osm_id}`;
          const tags: Record<string, string> = { ...(h.extratags ?? {}), [h.category]: h.type };
          if (h.name) tags.name = h.name;
          const cat = classify(tags);
          const lat = Number(h.lat);
          const lng = Number(h.lon);
          if (!h.name || seen.has(osmId) || cat !== category || haversineKm(center, { lat, lng }) * 1000 > radiusM) continue;
          seen.add(osmId);
          const a = h.address ?? {};
          const street = [a.road, a.house_number].filter(Boolean).join(" ");
          out.push({
            osmId, category, name: h.name.slice(0, 200), lat, lng,
            address: [street, a.suburb ?? a.neighbourhood, a.city ?? a.town].filter(Boolean).join(", ").slice(0, 255) || null,
            openingHours: tags.opening_hours?.slice(0, 255) ?? null, cuisine: tags.cuisine?.slice(0, 120) ?? null,
            website: (tags.website ?? tags["contact:website"])?.slice(0, 255) ?? null, tags,
          });
        }
      }
    }
    return out;
  }
}
