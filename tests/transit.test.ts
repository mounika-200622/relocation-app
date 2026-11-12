import { describe, expect, it } from "vitest";
import { parseDuration } from "@/lib/transit/swiss";
import { buildQuery, toRawPoi } from "@/lib/poi/overpass";
import { classify } from "@/lib/poi/categories";

describe("parseDuration", () => {
  it("parses the opendata duration format", () => {
    expect(parseDuration("00d01:05:00")).toBe(65);
    expect(parseDuration("01d00:10:00")).toBe(1450);
    expect(parseDuration(null)).toBe(0);
  });
});

describe("overpass helpers", () => {
  it("builds one query with an around filter per selector", () => {
    const q = buildQuery({ lat: 47.37, lng: 8.54 }, 1500, ["PHARMACY", "TRANSIT"]);
    expect(q).toContain("[out:json][timeout:60]");
    expect(q).toContain('nwr["amenity"="pharmacy"](around:1500,47.370000,8.540000);');
    expect(q.match(/around:1500/g)?.length).toBe(5);
  });
  it("converts ways using their center and skips unnamed food places", () => {
    expect(toRawPoi({ type: "way", id: 5, center: { lat: 1, lon: 2 }, tags: { amenity: "pharmacy", name: "Apotheke" } })).toMatchObject({ osmId: "way/5", lat: 1, lng: 2, category: "PHARMACY" });
    expect(toRawPoi({ type: "node", id: 6, lat: 1, lon: 2, tags: { amenity: "restaurant" } })).toBeNull();
  });
  it("classifies tags", () => {
    expect(classify({ railway: "tram_stop" })).toBe("TRANSIT");
    expect(classify({ shop: "mobile_phone" })).toBe("MOBILE_SHOP");
    expect(classify({ tourism: "apartment" })).toBe("GUEST_HOUSE");
    expect(classify({ building: "yes" })).toBeNull();
  });
});
