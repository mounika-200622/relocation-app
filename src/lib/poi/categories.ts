import type { PoiCategory } from "@prisma/client";

/** Overpass QL selectors per category (each is wrapped as nwr[...] / node[...] in the query). */
export const OVERPASS_SELECTORS: Record<PoiCategory, string[]> = {
  RESTAURANT: ['nwr["amenity"="restaurant"]["name"]'],
  CAFE: ['nwr["amenity"="cafe"]["name"]'],
  FAST_FOOD: ['nwr["amenity"="fast_food"]["name"]'],
  SUPERMARKET: ['nwr["shop"="supermarket"]'],
  CONVENIENCE: ['nwr["shop"="convenience"]'],
  HOSPITAL: ['nwr["amenity"="hospital"]'],
  CLINIC: ['nwr["amenity"="clinic"]'],
  PHARMACY: ['nwr["amenity"="pharmacy"]'],
  DOCTOR: ['nwr["amenity"="doctors"]'],
  BANK: ['nwr["amenity"="bank"]'],
  ATM: ['node["amenity"="atm"]'],
  TRANSIT: ['node["railway"~"^(station|halt|tram_stop)$"]["name"]', 'node["highway"="bus_stop"]["name"]', 'node["station"="subway"]["name"]', 'node["amenity"="ferry_terminal"]["name"]'],
  MOBILE_SHOP: ['nwr["shop"~"^(mobile_phone|telecommunication)$"]'],
  LAUNDRY: ['nwr["shop"~"^(laundry|dry_cleaning)$"]'],
  GYM: ['nwr["leisure"="fitness_centre"]'],
  UNIVERSITY: ['nwr["amenity"~"^(university|college)$"]["name"]'],
  POST_OFFICE: ['nwr["amenity"="post_office"]'],
  POLICE: ['nwr["amenity"="police"]'],
  HOTEL: ['nwr["tourism"="hotel"]["name"]'],
  HOSTEL: ['nwr["tourism"="hostel"]["name"]'],
  GUEST_HOUSE: ['nwr["tourism"~"^(guest_house|apartment)$"]["name"]'],
  CAMP_SITE: ['nwr["tourism"="camp_site"]["name"]'],
  ATTRACTION: ['nwr["tourism"="attraction"]["name"]'],
  MUSEUM: ['nwr["tourism"="museum"]["name"]'],
  VIEWPOINT: ['node["tourism"="viewpoint"]'],
  GALLERY: ['nwr["tourism"="gallery"]["name"]'],
  HISTORIC: ['nwr["historic"~"^(castle|monument|ruins|memorial|city_gate|fort|church|archaeological_site)$"]["name"]'],
  PARK: ['nwr["leisure"~"^(park|garden|nature_reserve)$"]["name"]'],
  NIGHTLIFE: ['nwr["amenity"~"^(bar|pub|nightclub|biergarten)$"]["name"]'],
  SHOPPING: ['nwr["shop"~"^(mall|department_store)$"]["name"]', 'nwr["amenity"="marketplace"]["name"]'],
};

/** Maps an OSM element's tags back to one of our categories (first match wins). */
export function classify(tags: Record<string, string>): PoiCategory | null {
  const a = tags.amenity;
  const s = tags.shop;
  const t = tags.tourism;
  if (a === "restaurant") return "RESTAURANT";
  if (a === "cafe") return "CAFE";
  if (a === "fast_food") return "FAST_FOOD";
  if (s === "supermarket") return "SUPERMARKET";
  if (s === "convenience") return "CONVENIENCE";
  if (a === "hospital") return "HOSPITAL";
  if (a === "clinic") return "CLINIC";
  if (a === "pharmacy") return "PHARMACY";
  if (a === "doctors") return "DOCTOR";
  if (a === "bank") return "BANK";
  if (a === "atm") return "ATM";
  if (tags.railway === "station" || tags.railway === "halt" || tags.railway === "tram_stop" || tags.highway === "bus_stop" || tags.station === "subway" || a === "ferry_terminal") return "TRANSIT";
  if (s === "mobile_phone" || s === "telecommunication") return "MOBILE_SHOP";
  if (s === "laundry" || s === "dry_cleaning") return "LAUNDRY";
  if (tags.leisure === "fitness_centre") return "GYM";
  if (a === "university" || a === "college") return "UNIVERSITY";
  if (a === "post_office") return "POST_OFFICE";
  if (a === "police") return "POLICE";
  if (t === "hotel") return "HOTEL";
  if (t === "hostel") return "HOSTEL";
  if (t === "guest_house" || t === "apartment") return "GUEST_HOUSE";
  if (t === "camp_site") return "CAMP_SITE";
  if (t === "museum") return "MUSEUM";
  if (t === "gallery") return "GALLERY";
  if (t === "viewpoint") return "VIEWPOINT";
  if (t === "attraction") return "ATTRACTION";
  if (tags.historic) return "HISTORIC";
  if (tags.leisure === "park" || tags.leisure === "garden" || tags.leisure === "nature_reserve") return "PARK";
  if (a === "bar" || a === "pub" || a === "nightclub" || a === "biergarten") return "NIGHTLIFE";
  if (s === "mall" || s === "department_store" || a === "marketplace") return "SHOPPING";
  return null;
}

export const CATEGORY_LABEL: Record<PoiCategory, string> = {
  RESTAURANT: "Restaurant", CAFE: "Café", FAST_FOOD: "Fast food", SUPERMARKET: "Supermarket", CONVENIENCE: "Convenience store",
  HOSPITAL: "Hospital", CLINIC: "Clinic", PHARMACY: "Pharmacy", DOCTOR: "Doctor", BANK: "Bank", ATM: "ATM", TRANSIT: "Transit stop",
  MOBILE_SHOP: "Phone & SIM shop", LAUNDRY: "Laundry", GYM: "Gym", UNIVERSITY: "University", POST_OFFICE: "Post office", POLICE: "Police",
  HOTEL: "Hotel", HOSTEL: "Hostel", GUEST_HOUSE: "Guest house", CAMP_SITE: "Campsite", ATTRACTION: "Attraction", MUSEUM: "Museum",
  VIEWPOINT: "Viewpoint", GALLERY: "Gallery", HISTORIC: "Historic site", PARK: "Park", NIGHTLIFE: "Bar / nightlife", SHOPPING: "Shopping",
};

/** Tabs on the "Nearby essentials" screen. */
export const ESSENTIAL_GROUPS = {
  food: { label: "Food", categories: ["RESTAURANT", "CAFE", "FAST_FOOD"] },
  groceries: { label: "Groceries", categories: ["SUPERMARKET", "CONVENIENCE"] },
  health: { label: "Health", categories: ["HOSPITAL", "CLINIC", "PHARMACY", "DOCTOR"] },
  transit: { label: "Transit", categories: ["TRANSIT"] },
  money: { label: "Banks & ATMs", categories: ["BANK", "ATM"] },
  phone: { label: "SIM & phone", categories: ["MOBILE_SHOP"] },
  daily: { label: "Daily life", categories: ["LAUNDRY", "POST_OFFICE", "GYM", "POLICE"] },
  study: { label: "Study", categories: ["UNIVERSITY"] },
} as const satisfies Record<string, { label: string; categories: PoiCategory[] }>;

export type EssentialGroup = keyof typeof ESSENTIAL_GROUPS;

/** Categories the trip planner draws from. */
export const TRIP_STAY: PoiCategory[] = ["HOSTEL", "GUEST_HOUSE", "HOTEL", "CAMP_SITE"];
export const TRIP_FOOD: PoiCategory[] = ["RESTAURANT", "CAFE", "FAST_FOOD"];
/** Sights are fetched in two lighter Overpass queries (public servers time out on one big one). */
export const TRIP_SIGHTS_CULTURE: PoiCategory[] = ["ATTRACTION", "MUSEUM", "GALLERY", "HISTORIC"];
export const TRIP_SIGHTS_OUTDOOR: PoiCategory[] = ["VIEWPOINT", "PARK", "NIGHTLIFE", "SHOPPING"];
export const TRIP_SIGHTS: PoiCategory[] = [...TRIP_SIGHTS_CULTURE, ...TRIP_SIGHTS_OUTDOOR];

/** Radii (metres) used by the trip planner; the cache is keyed by area + radius. */
export const TRIP_RADIUS = { stay: 2500, food: 1500, sights: 2000 } as const;
