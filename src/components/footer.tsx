import Link from "next/link";
import { Logo } from "@/components/brand";

export function Footer() {
  return (
    <footer className="no-print mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-6">
        <div>
          <Logo className="text-3xl" />
          <p className="mt-3 max-w-xs text-sm text-muted">Wherever you&apos;re headed, Nira gets you settled. Housing, roommates, essentials and trips — in one place.</p>
        </div>
        <FooterCol title="Relocate" links={[["Find a place", "/relocate"], ["Roommates", "/roommates"], ["Nearby essentials", "/essentials"], ["Compare places", "/compare"]]} />
        <FooterCol title="Learn" links={[["Settling-in guide", "/guide"], ["Switzerland", "/guide/ch"], ["Plan a trip", "/trip/new"]]} />
        <FooterCol title="For owners" links={[["List a place", "/signup?role=BUSINESS"], ["Business dashboard", "/business"]]} />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-subtle md:flex-row md:justify-between md:px-6">
          <span>© {new Date().getFullYear()} Nira · DBMS course project</span>
          <span>Map data © OpenStreetMap contributors · Timetables: transport.opendata.ch · Prices are estimates</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="text-sm text-muted hover:text-fg">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
