/**
 * Pure authorization rules shared by proxy.ts (page guard) and API route handlers.
 * Free of framework imports so they are unit-tested in tests/authz.test.ts.
 */
export type AppRole = "USER" | "BUSINESS" | "ADMIN";

type Rule = { prefix: string; roles: AppRole[] | "ANY" };

/** First matching prefix wins. "ANY" = any logged-in role. */
export const PAGE_RULES: Rule[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/business", roles: ["BUSINESS"] },
  { prefix: "/my-listings", roles: ["BUSINESS"] },
  { prefix: "/list-a-place", roles: ["BUSINESS"] },
  { prefix: "/relocate", roles: ["USER", "ADMIN"] },
  { prefix: "/roommates", roles: ["USER", "ADMIN"] },
  { prefix: "/saved", roles: ["USER", "ADMIN"] },
  { prefix: "/trip", roles: ["USER", "ADMIN"] },
  { prefix: "/choose-path", roles: ["USER", "ADMIN"] },
  { prefix: "/onboarding", roles: "ANY" },
  { prefix: "/essentials", roles: "ANY" },
  { prefix: "/chat", roles: "ANY" },
  { prefix: "/profile", roles: "ANY" },
  { prefix: "/settings", roles: "ANY" },
];

/** Pages anyone can open without logging in (listing pages, the guide, shared trips). */
const PUBLIC_PREFIXES = ["/share", "/listings", "/guide"];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => matches(pathname, p));
}

export type AccessDecision = "allow" | "login" | "forbidden";

/** Decide whether a (possibly anonymous) user may open a page. */
export function pageAccess(pathname: string, role: AppRole | null | undefined): AccessDecision {
  if (isPublicPath(pathname)) return "allow";
  const rule = PAGE_RULES.find((r) => matches(pathname, r.prefix));
  if (!rule) return "allow";
  if (!role) return "login";
  if (rule.roles === "ANY") return "allow";
  return rule.roles.includes(role) ? "allow" : "forbidden";
}

/** Where a role lands after login. */
export function homeFor(role: AppRole | null | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "BUSINESS") return "/business";
  return "/choose-path";
}

export function canManageListing(user: { id: number; role: AppRole }, listing: { ownerId: number }) {
  return user.role === "ADMIN" || listing.ownerId === user.id;
}

export function isParticipant(userId: number, convo: { userAId: number; userBId: number }) {
  return convo.userAId === userId || convo.userBId === userId;
}

/** Only relative, same-site callback URLs are honoured (prevents open redirects). */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  return raw;
}
