/**
 * Generates the illustrated sample photos used by the seed (public/samples/*.svg).
 * Each picture is a flat-style interior: a wall, a window with an alpine or city view,
 * furniture and plants, varied by a seeded RNG so every file is different but stable.
 *
 *   npx tsx scripts/generate-sample-art.ts
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.cwd(), "public/samples");
const W = 1200;
const H = 800;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const PALETTES = [
  { wall: "#e9e3d8", floor: "#b98b5e", accent: "#3f5d7d", soft: "#d4a373", sky: "#a8d0e6" },
  { wall: "#dfe7e2", floor: "#8c6a4f", accent: "#2f4858", soft: "#86bbd8", sky: "#f6d6ad" },
  { wall: "#f1ece4", floor: "#c9a27e", accent: "#6b4e71", soft: "#e5989b", sky: "#9ad1d4" },
  { wall: "#e4e1f0", floor: "#a47551", accent: "#283d3b", soft: "#c8b6ff", sky: "#bde0fe" },
  { wall: "#efe6da", floor: "#7f5539", accent: "#bc4749", soft: "#a7c957", sky: "#cde7f0" },
  { wall: "#dde5ed", floor: "#9c7653", accent: "#1d3557", soft: "#f4a261", sky: "#ffd6a5" },
  { wall: "#f3efe9", floor: "#b08968", accent: "#355070", soft: "#eaac8b", sky: "#b8e0d2" },
  { wall: "#e6efe9", floor: "#936639", accent: "#4a4e69", soft: "#9a8c98", sky: "#ffe5b4" },
];

function view(r: () => number, x: number, y: number, w: number, h: number, sky: string, kind: "alps" | "city" | "lake") {
  const parts = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sky}"/>`];
  const sunX = x + w * (0.2 + r() * 0.6);
  parts.push(`<circle cx="${sunX}" cy="${y + h * 0.28}" r="${h * 0.09}" fill="#fff6d5" opacity="0.9"/>`);
  if (kind === "alps" || kind === "lake") {
    const base = y + h * (kind === "lake" ? 0.62 : 0.78);
    let d = `M${x},${base}`;
    const peaks = 4 + Math.floor(r() * 3);
    for (let i = 0; i <= peaks; i++) {
      const px = x + (w / peaks) * i;
      const py = y + h * (0.25 + r() * 0.3);
      d += ` L${px - w / peaks / 2},${py + h * 0.15} L${px},${py}`;
    }
    d += ` L${x + w},${base} Z`;
    parts.push(`<path d="${d}" fill="#7d8fa6"/>`);
    parts.push(`<path d="${d}" fill="#ffffff" opacity="0.35" transform="translate(0,${-h * 0.02}) scale(1,0.98)"/>`);
    if (kind === "lake") parts.push(`<rect x="${x}" y="${base}" width="${w}" height="${y + h - base}" fill="#5b8fb9"/>`);
    else parts.push(`<rect x="${x}" y="${base}" width="${w}" height="${y + h - base}" fill="#6a994e"/>`);
  } else {
    for (let i = 0; i < 7; i++) {
      const bw = w / 7;
      const bh = h * (0.3 + r() * 0.5);
      parts.push(`<rect x="${x + i * bw + 2}" y="${y + h - bh}" width="${bw - 4}" height="${bh}" fill="${["#8d99ae", "#adb5bd", "#6c757d"][i % 3]}"/>`);
      for (let k = 0; k < 4; k++) parts.push(`<rect x="${x + i * bw + 8 + (k % 2) * (bw / 2 - 6)}" y="${y + h - bh + 10 + Math.floor(k / 2) * 22}" width="8" height="12" fill="#ffe8a3" opacity="0.8"/>`);
    }
  }
  return parts.join("");
}

function plant(x: number, y: number, s: number, pot: string) {
  return `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="-70" rx="34" ry="60" fill="#588157"/><ellipse cx="-30" cy="-50" rx="22" ry="45" fill="#3a5a40" transform="rotate(-25 -30 -50)"/>
    <ellipse cx="30" cy="-55" rx="22" ry="45" fill="#3a5a40" transform="rotate(25 30 -55)"/>
    <path d="M-28,-10 L28,-10 L22,40 L-22,40 Z" fill="${pot}"/></g>`;
}

function scene(i: number) {
  const r = rng(1000 + i * 7919);
  const p = PALETTES[i % PALETTES.length]!;
  const kind = (["alps", "city", "lake"] as const)[i % 3];
  const floorY = 560;
  const winX = 140 + r() * 420;
  const winW = 300 + r() * 120;
  const isBedroom = i % 2 === 0;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`);
  out.push(`<defs><linearGradient id="l${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.25"/><stop offset="1" stop-color="#000000" stop-opacity="0.08"/></linearGradient></defs>`);
  out.push(`<rect width="${W}" height="${floorY}" fill="${p.wall}"/>`);
  out.push(`<rect y="${floorY}" width="${W}" height="${H - floorY}" fill="${p.floor}"/>`);
  for (let k = 0; k < 9; k++) out.push(`<line x1="${k * 150}" y1="${floorY}" x2="${k * 150 - 80}" y2="${H}" stroke="#000" stroke-opacity="0.07" stroke-width="3"/>`);
  // window
  out.push(`<rect x="${winX - 14}" y="86" width="${winW + 28}" height="338" rx="6" fill="#ffffff"/>`);
  out.push(view(r, winX, 100, winW, 310, p.sky, kind));
  out.push(`<rect x="${winX + winW / 2 - 5}" y="100" width="10" height="310" fill="#ffffff"/>`);
  out.push(`<rect x="${winX - 30}" y="420" width="${winW + 60}" height="16" rx="4" fill="#ffffff"/>`);
  // curtain
  out.push(`<path d="M${winX - 60},70 Q${winX - 30},250 ${winX - 64},470 L${winX - 18},470 Q${winX - 4},250 ${winX - 18},70 Z" fill="${p.soft}" opacity="0.85"/>`);
  // picture frames
  const fx = winX > 600 ? 120 : 820;
  out.push(`<rect x="${fx}" y="150" width="140" height="100" rx="4" fill="${p.accent}"/><rect x="${fx + 10}" y="160" width="120" height="80" fill="${p.soft}"/><circle cx="${fx + 70}" cy="200" r="22" fill="${p.wall}"/>`);
  out.push(`<rect x="${fx + 170}" y="130" width="80" height="120" rx="4" fill="${p.accent}"/><rect x="${fx + 178}" y="138" width="64" height="104" fill="${p.sky}"/>`);
  // rug
  out.push(`<ellipse cx="${W / 2 + (r() - 0.5) * 200}" cy="${floorY + 130}" rx="360" ry="70" fill="${p.soft}" opacity="0.55"/>`);
  if (isBedroom) {
    const bx = 300 + r() * 300;
    out.push(`<rect x="${bx}" y="${floorY - 150}" width="440" height="40" rx="10" fill="${p.accent}"/>`);
    out.push(`<rect x="${bx - 10}" y="${floorY - 70}" width="470" height="110" rx="14" fill="#ffffff"/>`);
    out.push(`<rect x="${bx - 10}" y="${floorY - 40}" width="470" height="80" rx="14" fill="${p.soft}"/>`);
    out.push(`<rect x="${bx + 20}" y="${floorY - 105}" width="120" height="50" rx="20" fill="#fdfcfa"/><rect x="${bx + 160}" y="${floorY - 105}" width="120" height="50" rx="20" fill="#fdfcfa"/>`);
    out.push(`<rect x="${bx + 470}" y="${floorY - 70}" width="90" height="100" rx="6" fill="${p.floor}" stroke="#000" stroke-opacity="0.1"/>`);
    out.push(`<rect x="${bx + 500}" y="${floorY - 150}" width="8" height="80" fill="#333"/><path d="M${bx + 474},${floorY - 150} L${bx + 534},${floorY - 150} L${bx + 520},${floorY - 190} L${bx + 488},${floorY - 190} Z" fill="#ffd166"/>`);
  } else {
    const sx = 260 + r() * 340;
    out.push(`<rect x="${sx}" y="${floorY - 140}" width="460" height="90" rx="30" fill="${p.accent}"/>`);
    out.push(`<rect x="${sx - 30}" y="${floorY - 80}" width="520" height="90" rx="26" fill="${p.accent}"/>`);
    out.push(`<rect x="${sx}" y="${floorY - 70}" width="220" height="50" rx="16" fill="#ffffff" opacity="0.18"/><rect x="${sx + 240}" y="${floorY - 70}" width="220" height="50" rx="16" fill="#ffffff" opacity="0.18"/>`);
    out.push(`<rect x="${sx + 20}" y="${floorY - 125}" width="70" height="55" rx="14" fill="${p.soft}"/>`);
    out.push(`<rect x="${sx + 110}" y="${floorY + 60}" width="240" height="18" rx="9" fill="#3d3d3d"/><rect x="${sx + 130}" y="${floorY + 78}" width="10" height="40" fill="#3d3d3d"/><rect x="${sx + 320}" y="${floorY + 78}" width="10" height="40" fill="#3d3d3d"/>`);
    out.push(`<circle cx="${sx + 200}" cy="${floorY + 48}" r="14" fill="#ffffff"/><rect x="${sx + 250}" y="${floorY + 30}" width="40" height="30" rx="4" fill="${p.soft}"/>`);
  }
  // shelf with books
  const shx = winX > 600 ? 120 : 860;
  out.push(`<rect x="${shx}" y="300" width="220" height="12" fill="${p.floor}"/>`);
  for (let k = 0; k < 7; k++) out.push(`<rect x="${shx + 10 + k * 28}" y="${300 - 40 - (k % 3) * 8}" width="22" height="${40 + (k % 3) * 8}" fill="${[p.accent, p.soft, "#e9c46a", "#264653"][k % 4]}"/>`);
  out.push(plant(winX > 600 ? 1080 : 100, floorY + 40, 1.1, p.accent));
  out.push(plant(winX + winW + 80 > 1100 ? winX - 120 : winX + winW + 80, floorY - 10, 0.7, "#ffffff"));
  out.push(`<rect width="${W}" height="${H}" fill="url(#l${i})"/>`);
  out.push(`</svg>`);
  return out.join("\n");
}

fs.mkdirSync(OUT, { recursive: true });
const COUNT = 16;
for (let i = 0; i < COUNT; i++) {
  fs.writeFileSync(path.join(OUT, `home-${String(i + 1).padStart(2, "0")}.svg`), scene(i));
}
console.log(`wrote ${COUNT} sample images to ${OUT}`);
