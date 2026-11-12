/**
 * Downloads real, freely licensed photos from Wikimedia Commons:
 *   - room interiors for the demo listings  → public/photos/homes/
 *   - each demo city's main Wikipedia photo → public/photos/places/
 * Only CC0 / public domain / CC BY / CC BY-SA images are used, and every file's author,
 * licence and source page are written to prisma/seed/data/photos.json (shown in the app
 * and in docs/image-credits.md). Re-runnable: existing files are skipped.
 *
 *   npx tsx scripts/fetch-photos.ts
 */
import fs from "node:fs";
import path from "node:path";

const UA = process.env.NOMINATIM_USER_AGENT || "Nira-Student-Project/1.0 (https://github.com/mounika-200622/relocation-app)";
const OUT = path.resolve("public/photos");
const MANIFEST = path.resolve("prisma/seed/data/photos.json");
const OK_LICENSE = /^(CC0|Public domain|No restrictions|FAL|CC BY(-SA)? [0-9.]+( [a-z]{2})?)$/i;
// checked on the file title: Commons URLs now carry tracking query strings
const IS_PHOTO = /\.(jpe?g)$/i;
// subjects that are not "a room you could rent today"
const DENY = /hoard|clutter|airstrike|damage|ruin|HABS|Interior view,|ca\. ?1[89]\d\d|19[0-6]\d|temple|monk|museum|château|chateau|castle|palace|kids|child|prison|hospital|abandon|for sale sign|construction|exhibit|display\)/i;

type Credit = { file: string; title: string; author: string; license: string; source: string };
type Manifest = { homes: Credit[]; places: Record<string, Credit> };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 120);

async function api(base: string, params: Record<string, string>) {
  const url = new URL(base);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await sleep(300); // be gentle with the API
  return res.json();
}

type Info = { title: string; url: string; thumb: string; width: number; height: number; license: string; author: string; page: string };

async function fileInfo(titles: string[]): Promise<Info[]> {
  const data = await api("https://commons.wikimedia.org/w/api.php", { action: "query", titles: titles.join("|"), prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "1280" });
  return (data.query?.pages ?? []).filter((p: { imageinfo?: unknown[] }) => p.imageinfo).map((p: { title: string; imageinfo: { url: string; thumburl: string; width: number; height: number; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] }) => {
    const i = p.imageinfo[0]!;
    return { title: p.title, url: i.url, thumb: i.thumburl, width: i.width, height: i.height, license: i.extmetadata.LicenseShortName?.value ?? "", author: strip(i.extmetadata.Artist?.value) || "Unknown", page: i.descriptionurl };
  });
}

async function download(info: Info, dir: string, name: string): Promise<Credit | null> {
  const rel = `/photos/${dir}/${name}.jpg`;
  const abs = path.join(OUT, dir, `${name}.jpg`);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (!fs.existsSync(abs)) {
    const res = await fetch(info.thumb, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    fs.writeFileSync(abs, Buffer.from(await res.arrayBuffer()));
    await sleep(400);
  }
  return { file: rel, title: info.title.replace(/^File:/, ""), author: info.author, license: info.license, source: info.page };
}

const HOME_QUERIES = [
  "modern bedroom apartment interior", "bedroom apartment interior", "living room apartment interior", "modern living room interior",
  "apartment kitchen interior modern", "studio apartment interior", "hotel room interior", "dorm room empty", "loft apartment interior",
];

async function homes(): Promise<Credit[]> {
  const picked: Info[] = [];
  const seen = new Set<string>();
  for (const q of HOME_QUERIES) {
    const data = await api("https://commons.wikimedia.org/w/api.php", { action: "query", list: "search", srnamespace: "6", srlimit: "40", srsearch: `${q} filetype:bitmap` });
    const titles: string[] = (data.query?.search ?? []).map((s: { title: string }) => s.title).filter((t: string) => !DENY.test(t) && !seen.has(t));
    for (let i = 0; i < titles.length; i += 20) {
      for (const info of await fileInfo(titles.slice(i, i + 20))) {
        if (seen.has(info.title)) continue;
        seen.add(info.title);
        const landscape = info.width >= info.height * 1.2 && info.width >= 1400;
        if (OK_LICENSE.test(info.license) && landscape && IS_PHOTO.test(info.title)) picked.push(info);
      }
    }
    console.log(`  "${q}": ${picked.length} usable so far`);
    if (picked.length >= 48) break;
  }
  const out: Credit[] = [];
  for (const [i, info] of picked.slice(0, 48).entries()) {
    const c = await download(info, "homes", `home-${String(i + 1).padStart(2, "0")}`);
    if (c) out.push(c);
  }
  return out;
}

const PLACES: Record<string, string> = {
  "CH:Zürich": "Zürich", "CH:Genève": "Geneva", "CH:Lausanne": "Lausanne", "CH:Basel": "Basel", "CH:Bern": "Bern", "CH:Luzern": "Lucerne",
  "CH:Lugano": "Lugano", "CH:Sankt Gallen": "St. Gallen", "CH:Fribourg": "Fribourg", "CH:Zug": "Zug", "DE:Berlin": "Berlin", "IN:Bengaluru": "Bangalore",
  // countries: a well-known landscape or landmark (a country article's own page image is its flag)
  "country:CH": "Lauterbrunnen", "country:IN": "Taj Mahal", "country:DE": "Brandenburg Gate", "country:VN": "Ha Long Bay", "country:US": "Golden Gate Bridge",
  "country:GB": "Tower Bridge", "country:SG": "Gardens by the Bay", "country:JP": "Mount Fuji", "country:FR": "Eiffel Tower", "country:AE": "Burj Khalifa", "country:TH": "Wat Arun",
};

async function places(existing: Record<string, Credit>): Promise<Record<string, Credit>> {
  const out: Record<string, Credit> = { ...existing };
  for (const [key, article] of Object.entries(PLACES)) {
    if (out[key] && fs.existsSync(path.join("public", out[key].file))) continue;
    const page = await api("https://en.wikipedia.org/w/api.php", { action: "query", titles: article, prop: "pageimages", piprop: "name", redirects: "1" });
    const name: string | undefined = page.query?.pages?.[0]?.pageimage;
    if (!name) continue;
    const [info] = await fileInfo([`File:${name}`]);
    if (!info || !OK_LICENSE.test(info.license) || !IS_PHOTO.test(info.title)) {
      console.log(`  skip ${key}: ${info?.license ?? "no file"}`);
      continue;
    }
    const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const c = await download(info, "places", slug);
    if (c) out[key] = c;
    console.log(`  ${key} ← ${c?.title} (${c?.license})`);
  }
  return out;
}

async function main() {
  const prev: Manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : { homes: [], places: {} };
  const manifest: Manifest = { homes: prev.homes.length >= 24 ? prev.homes : await homes(), places: await places(prev.places) };
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`wrote ${manifest.homes.length} home photos and ${Object.keys(manifest.places).length} place photos`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
