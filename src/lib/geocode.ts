/**
 * OpenStreetMap Nominatim geocoding, following its usage policy:
 * identifying User-Agent, max 1 request per second, results cached in memory.
 */
const cache = new Map<string, { lat: number; lng: number; label: string } | null>();
let chain: Promise<unknown> = Promise.resolve();
let last = 0;

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = Math.max(0, last + 1100 - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    return fn();
  });
  chain = run.catch(() => undefined);
  return run;
}

export async function geocode(query: string, countryIso?: string) {
  const key = `${countryIso ?? ""}|${query.toLowerCase().trim()}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  if (countryIso) url.searchParams.set("countrycodes", countryIso.toLowerCase());

  const result = await throttle(async () => {
    const res = await fetch(url, {
      headers: { "User-Agent": process.env.NOMINATIM_USER_AGENT || "Nira-Student-Project/1.0", "Accept-Language": "en" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    return rows[0] ? { lat: Number(rows[0].lat), lng: Number(rows[0].lon), label: rows[0].display_name } : null;
  });
  cache.set(key, result);
  return result;
}
