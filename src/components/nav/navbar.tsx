"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Bell, ChevronDown, Compass, Heart, LogOut, Plane, Settings, User } from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";
import { buttonClass } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { activeHref, navFor, type Mode } from "@/components/nav/nav-config";
import { useUnread } from "@/components/nav/unread";
import { NotificationsPanel } from "@/components/nav/notifications-panel";

const HIDE_ON = ["/login", "/signup", "/forgot-password", "/reset-password", "/onboarding"];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? null;
  const { counts } = useUnread();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [picked, setPicked] = useState<Mode>("relocate");
  // the URL decides inside trip/relocate sections; elsewhere keep what the user picked
  const mode: Mode = pathname.startsWith("/trip") ? "trip" : ["/relocate", "/roommates", "/essentials", "/saved"].some((p) => pathname.startsWith(p)) ? "relocate" : picked;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (HIDE_ON.some((p) => pathname.startsWith(p)) || pathname.startsWith("/share/")) return null;

  const items = navFor(role, mode);
  const current = activeHref(pathname, items);
  const switchMode = (m: Mode) => {
    setPicked(m);
    router.push(m === "trip" ? "/trip" : "/relocate/home");
  };

  return (
    <header
      className={cn(
        "no-print sticky top-0 z-40 transition-all duration-300",
        scrolled ? "bg-bg/75 backdrop-blur-xl border-b border-line" : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Logo className="text-[1.7rem]" href={role ? (role === "BUSINESS" ? "/business" : role === "ADMIN" ? "/admin" : mode === "trip" ? "/trip" : "/relocate/home") : "/"} />

        {role === "USER" && (
          <div className="hidden lg:flex items-center rounded-full border border-line bg-soft p-1 text-[13px]" role="tablist" aria-label="Mode">
            <button role="tab" aria-selected={mode === "relocate"} onClick={() => switchMode("relocate")} className={cn("flex items-center gap-1.5 rounded-full px-3 h-7 font-medium transition", mode === "relocate" ? "bg-elev text-fg shadow-sm" : "text-muted hover:text-fg")}>
              <Compass className="h-3.5 w-3.5" /> Relocate
            </button>
            <button role="tab" aria-selected={mode === "trip"} onClick={() => switchMode("trip")} className={cn("flex items-center gap-1.5 rounded-full px-3 h-7 font-medium transition", mode === "trip" ? "bg-elev text-fg shadow-sm" : "text-muted hover:text-fg")}>
              <Plane className="h-3.5 w-3.5" /> Trip
            </button>
          </div>
        )}

        <nav className="hidden md:flex items-center gap-1 ml-2" aria-label="Main">
          {items.map((item) => {
            const active = current === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex items-center gap-2 rounded-lg px-3 h-9 text-[13.5px] font-medium transition", active ? "text-fg bg-soft" : "text-muted hover:text-fg")}
              >
                {item.label}
                {item.badge === "messages" && counts.messages > 0 && (
                  <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent-strong px-1 text-[10px] font-bold text-white" aria-label={`${counts.messages} unread`}>
                    {counts.messages > 99 ? "99+" : counts.messages}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-soft hover:text-fg" />
          {status === "authenticated" && session?.user ? (
            <>
              {role === "USER" && (
                <Link href="/saved" className="hidden md:grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-soft hover:text-fg" aria-label="Saved places">
                  <Heart className="h-[18px] w-[18px]" />
                </Link>
              )}
              <div className="relative">
                <button onClick={() => setBellOpen((o) => !o)} className="relative grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-soft hover:text-fg" aria-label={`Notifications${counts.notifications ? `, ${counts.notifications} unread` : ""}`}>
                  <Bell className="h-[18px] w-[18px]" />
                  {counts.notifications > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warm ring-2 ring-bg" />}
                </button>
                {bellOpen && <NotificationsPanel onClose={() => setBellOpen(false)} />}
              </div>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 hover:bg-soft" aria-haspopup="menu" aria-expanded={menuOpen}>
                  <Avatar name={session.user.name ?? "You"} size={32} />
                  <ChevronDown className="h-3.5 w-3.5 text-subtle" />
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-60 card p-1.5 animate-fade-up">
                    <div className="px-3 py-2.5 border-b border-line mb-1">
                      <div className="text-sm font-medium truncate">{session.user.name}</div>
                      <div className="text-xs text-subtle capitalize">{role?.toLowerCase()} account</div>
                    </div>
                    <MenuLink href="/profile" icon={<User className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>Profile</MenuLink>
                    {role === "USER" && <MenuLink href="/saved" icon={<Heart className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>Saved places</MenuLink>}
                    {role === "USER" && (
                      <MenuLink href={mode === "trip" ? "/relocate/home" : "/trip"} icon={mode === "trip" ? <Compass className="h-4 w-4" /> : <Plane className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                        Switch to {mode === "trip" ? "Relocate" : "Trip"} mode
                      </MenuLink>
                    )}
                    <MenuLink href="/settings" icon={<Settings className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>Settings</MenuLink>
                    <button role="menuitem" onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-soft">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : status === "unauthenticated" ? (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>Log in</Link>
              <Link href="/signup" className={buttonClass("primary", "sm")}>Get started</Link>
            </>
          ) : (
            <div className="h-8 w-20 skeleton" />
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link role="menuitem" href={href} onClick={onClick} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-soft hover:text-fg">
      {icon}
      {children}
    </Link>
  );
}
