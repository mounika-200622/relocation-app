import {
  BookOpen, Building2, Compass, FileText, Heart, Home, LayoutDashboard, MapPin, MessageCircle, Plane, Plus, Scale, Search, Shield, Users,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/lib/authz";

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: "messages"; match?: string[] };
export type Mode = "relocate" | "trip";

export function modeFromPath(pathname: string): Mode {
  return pathname.startsWith("/trip") ? "trip" : "relocate";
}

export function navFor(role: AppRole | null, mode: Mode): NavItem[] {
  if (role === "ADMIN") {
    return [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/listings", label: "Listings", icon: Building2 },
      { href: "/admin/content", label: "Content", icon: FileText },
      { href: "/admin/reports", label: "Reports", icon: Shield },
    ];
  }
  if (role === "BUSINESS") {
    return [
      { href: "/business", label: "Dashboard", icon: LayoutDashboard },
      { href: "/business/listings/new", label: "New listing", icon: Plus },
      { href: "/chat", label: "Messages", icon: MessageCircle, badge: "messages" },
      { href: "/guide", label: "Guide", icon: BookOpen },
    ];
  }
  if (role === "USER") {
    if (mode === "trip") {
      return [
        { href: "/trip", label: "My trips", icon: Plane },
        { href: "/trip/new", label: "Plan a trip", icon: Compass },
        { href: "/guide", label: "Guide", icon: BookOpen },
        { href: "/chat", label: "Messages", icon: MessageCircle, badge: "messages" },
      ];
    }
    return [
      { href: "/relocate/home", label: "Home", icon: Home },
      { href: "/relocate", label: "Find a place", icon: Search, match: ["/relocate", "/listings"] },
      { href: "/roommates", label: "Roommates", icon: Users },
      { href: "/essentials", label: "Essentials", icon: MapPin },
      { href: "/guide", label: "Guide", icon: BookOpen },
      { href: "/chat", label: "Messages", icon: MessageCircle, badge: "messages" },
    ];
  }
  return [
    { href: "/relocate", label: "Explore homes", icon: Search },
    { href: "/guide", label: "Settling-in guide", icon: BookOpen },
    { href: "/compare", label: "Compare", icon: Scale },
  ];
}

/** Bottom tab bar on phones: at most five items. */
export function mobileTabsFor(role: AppRole | null, mode: Mode): NavItem[] {
  if (role === "USER" && mode === "relocate") {
    return [
      { href: "/relocate/home", label: "Home", icon: Home },
      { href: "/relocate", label: "Search", icon: Search, match: ["/relocate", "/listings"] },
      { href: "/roommates", label: "Roommates", icon: Users },
      { href: "/saved", label: "Saved", icon: Heart },
      { href: "/chat", label: "Inbox", icon: MessageCircle, badge: "messages" },
    ];
  }
  return navFor(role, mode).slice(0, 5);
}

/** Longest matching prefix wins, so /trip/new lights up "Plan a trip", not "My trips". */
export function activeHref(pathname: string, items: NavItem[]): string | null {
  let best: string | null = null;
  let bestLen = -1;
  for (const item of items) {
    for (const p of [item.href, ...(item.match ?? [])]) {
      const hit = pathname === p || pathname.startsWith(p + "/");
      if (hit && p.length > bestLen) {
        best = item.href;
        bestLen = p.length;
      }
    }
  }
  return best;
}
