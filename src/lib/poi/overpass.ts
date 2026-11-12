import type { PoiCategory } from "@prisma/client";
import { OVERPASS_SELECTORS, classify } from "@/lib/poi/categories";
import { ProviderUnavailable, type PoiProvider, type RawPoi } from "@/lib/poi/provider";

type Element = { type: "node" | "way" | "relation"; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

// Overpass etiquette: one query at a time per client, identify ourselves, back off on 429/504.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function buildQuery(center: { lat: number; lng: number }, radiusM: number, categories: PoiCategory[], limit = 500) {
  const around = `(around:${Math.round(radiusM)},${center.lat.toFixed(6)},${center.lng.toFixed(6)})`;
  const parts = categories.flatMap((c) => OVERPASS_SELECTORS[c]).map((sel) => `  ${sel}${around};`);
  return `[out:json][timeout:60];\n(\n${parts.join("\n")}\n);\nout center tags ${limit};`;
}

function address(tags: Record<string, string>) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const city = [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ");
  return [street, city].filter(Boolean).join(", ") || null;
}

export function toRawPoi(el: Element): RawPoi | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat === undefined || lng === undefined) return null;
  const category = classify(tags);
  if (!category) return null;
  const name = tags.name || tags.brand || tags.operator || (category === "ATM" ? "ATM" : category === "VIEWPOINT" ? "Viewpoint" : null);
  if (!name) return null;
  return {
    osmId: `${el.type}/${el.id}`,
    category,
    name: name.slice(0, 200),
    lat,
    lng,
    address: address(tags)?.slice(0, 255) ?? null,
    openingHours: tags.opening_hours?.slice(0, 255) ?? null,
    cuisine: tags.cuisine?.slice(0, 120) ?? null,
    website: (tags.website || tags["contact:website"])?.slice(0, 255) ?? null,
    tags,
  };
}

export class OverpassProvider implements PoiProvider {
  readonly name = "overpass";
  private urls: string[];
  constructor(urls: string) {
    // OVERPASS_URL may list several comma-separated mirrors; they are tried in order
    this.urls = urls.split(",").map((u) => u.trim()).filter(Boolean);
  }

  search(center: { lat: number; lng: number }, radiusM: number, categories: PoiCategory[]) {
    return serial(async () => {
      const body = new URLSearchParams({ data: buildQuery(center, radiusM, categories) });
      for (let attempt = 0; attempt < Math.max(3, this.urls.length); attempt++) {
        const url = this.urls[attempt % this.urls.length]!;
        try {
          const res = await fetch(url, {
            method: "POST",
            body,
            headers: { "User-Agent": process.env.NOMINATIM_USER_AGENT || "Nira-Student-Project/1.0", Accept: "application/json" },
            signal: AbortSignal.timeout(70_000),
          });
          if (res.status === 429 || res.status === 504 || res.status === 503) {
            await sleep(1500 * 2 ** attempt); // exponential backoff
            continue;
          }
          if (!res.ok) {
            if (attempt < this.urls.length - 1) continue; // try the next mirror
            throw new ProviderUnavailable(`Overpass ${res.status}`);
          }
          const data = (await res.json()) as { elements: Element[] };
          const seen = new Set<string>();
          return data.elements.map(toRawPoi).filter((p): p is RawPoi => {
            if (!p || seen.has(p.osmId) || !categories.includes(p.category)) return false;
            seen.add(p.osmId);
            return true;
          });
        } catch (err) {
          if (err instanceof ProviderUnavailable) throw err;
          if (attempt >= Math.max(3, this.urls.length) - 1) throw new ProviderUnavailable((err as Error).message);
          await sleep(1500 * 2 ** attempt);
        }
      }
      throw new ProviderUnavailable("Overpass is busy");
    });
  }
}
