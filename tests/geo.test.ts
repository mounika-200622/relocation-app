import { describe, expect, it } from "vitest";
import { areaKey, boundingBox, haversineKm, nearestNeighbourOrder } from "@/lib/geo";

const zurich = { lat: 47.3769, lng: 8.5417 };
const geneva = { lat: 46.2044, lng: 6.1432 };

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm(zurich, zurich)).toBe(0);
  });
  it("matches the known Zurich-Geneva distance (~224 km, same as fn_distance_km)", () => {
    expect(haversineKm(zurich, geneva)).toBeCloseTo(224.4, 0);
  });
  it("is symmetric", () => {
    expect(haversineKm(zurich, geneva)).toBeCloseTo(haversineKm(geneva, zurich), 9);
  });
});

describe("boundingBox", () => {
  it("contains points within the radius", () => {
    const box = boundingBox(zurich, 2);
    const p = { lat: zurich.lat + 0.01, lng: zurich.lng + 0.01 };
    expect(haversineKm(zurich, p)).toBeLessThan(2);
    expect(p.lat).toBeLessThan(box.maxLat);
    expect(p.lng).toBeLessThan(box.maxLng);
  });
});

describe("nearestNeighbourOrder", () => {
  it("visits the closest point first", () => {
    const far = { lat: 47.5, lng: 8.7, id: "far" };
    const near = { lat: 47.38, lng: 8.545, id: "near" };
    const mid = { lat: 47.42, lng: 8.6, id: "mid" };
    expect(nearestNeighbourOrder(zurich, [far, mid, near]).map((p) => p.id)).toEqual(["near", "mid", "far"]);
  });
});

describe("areaKey", () => {
  it("rounds to a ~1 km grid", () => {
    expect(areaKey({ lat: 47.37691, lng: 8.54171 }, 1500)).toBe("47.38,8.54,1500");
  });
});
