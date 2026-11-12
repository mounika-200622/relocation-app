/** Mean Earth radius (IUGG) in km – same constant as fn_distance_km in SQL. */
export const EARTH_RADIUS_KM = 6371.0088;

export type LatLng = { lat: number; lng: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points in kilometres (Haversine formula). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Axis-aligned bounding box around a point; lets SQL use the (lat, lng) index before Haversine. */
export function boundingBox(center: LatLng, radiusKm: number) {
  const dLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const dLng = dLat / Math.max(Math.cos(rad(center.lat)), 0.01);
  return { minLat: center.lat - dLat, maxLat: center.lat + dLat, minLng: center.lng - dLng, maxLng: center.lng + dLng };
}

/**
 * Orders points by repeatedly visiting the nearest unvisited one (nearest-neighbour
 * heuristic for a short walking route). O(n²) on purpose: n is a single day's stops (≤ 8).
 */
export function nearestNeighbourOrder<T extends LatLng>(start: LatLng, points: T[]): T[] {
  const remaining = [...points];
  const route: T[] = [];
  let current = start;
  while (remaining.length) {
    let best = 0;
    let bestD = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineKm(current, p);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const [next] = remaining.splice(best, 1);
    route.push(next!);
    current = next!;
  }
  return route;
}

/** Rounds a coordinate pair + radius into a stable cache key (~1.1 km grid at 2 decimals). */
export function areaKey(center: LatLng, radiusM: number) {
  return `${center.lat.toFixed(2)},${center.lng.toFixed(2)},${Math.round(radiusM)}`;
}
