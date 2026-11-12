import type { Prisma } from "@prisma/client";

/** Prisma Decimal | number | string | null -> number | null */
export function num(v: Prisma.Decimal | number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

/** Formats a price with the right currency symbol and grouping, e.g. "CHF 1,250". */
export function formatMoney(amount: number | null | undefined, currency = "USD", opts: { decimals?: number } = {}) {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "—";
  const decimals = opts.decimals ?? (Math.abs(amount) < 100 && amount % 1 !== 0 ? 2 : 0);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(decimals)}`;
  }
}

export function formatRange(min: number, max: number, currency: string) {
  if (Math.round(min) === Math.round(max)) return formatMoney(min, currency);
  return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
}

export function formatDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", opts).format(date);
}

export function relativeTime(d: Date | string, now = Date.now()) {
  const t = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  const s = Math.round((now - t) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d, { day: "numeric", month: "short" });
}

export function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export const LISTING_TYPE_LABEL: Record<string, string> = {
  DORM: "Dorm",
  APARTMENT: "Apartment",
  STUDIO: "Studio",
  SHARED_ROOM: "Shared room",
  PRIVATE_ROOM: "Private room",
};

export const PREFERENCE_LABEL: Record<string, string> = {
  ANYONE: "Anyone",
  FEMALE_ONLY: "Women only",
  MALE_ONLY: "Men only",
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function titleCase(s: string) {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
