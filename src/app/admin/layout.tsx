import Link from "next/link";
import { pageUser } from "@/lib/session";

const LINKS = [["/admin", "Overview"], ["/admin/users", "Users"], ["/admin/listings", "Listings"], ["/admin/content", "Guide & costs"], ["/admin/reports", "Reports"]] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await pageUser(["ADMIN"]);
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6">
      <nav aria-label="Admin" className="no-scrollbar mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-elev p-1">
        {LINKS.map(([href, label]) => <Link key={href} href={href} className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-muted hover:bg-soft hover:text-fg">{label}</Link>)}
      </nav>
      {children}
    </div>
  );
}
