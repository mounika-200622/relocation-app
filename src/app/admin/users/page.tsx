import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/misc";
import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const { q, role } = await searchParams;
  const users = await prisma.user.findMany({
    where: {
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
      ...(role === "USER" || role === "BUSINESS" || role === "ADMIN" ? { role } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, businessProfile: { select: { isVerified: true } }, _count: { select: { listings: true, roommateRequests: true, reportsReceived: true } } },
  });
  return (
    <div>
      <PageHeader title="Users" description="Search, deactivate, verify businesses and change roles." />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name or email" className="h-10 flex-1 rounded-xl border border-line bg-soft px-3 text-sm outline-none" aria-label="Search users" />
        <select name="role" defaultValue={role ?? ""} className="h-10 rounded-xl border border-line bg-soft px-3 text-sm" aria-label="Role"><option value="">All roles</option><option>USER</option><option>BUSINESS</option><option>ADMIN</option></select>
        <button className="h-10 rounded-xl bg-accent-strong px-4 text-sm font-medium text-white">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle"><tr><th className="px-5 py-3">User</th><th className="px-3">Role</th><th className="px-3">Joined</th><th className="px-3">Listings</th><th className="px-3">Requests</th><th className="px-3">Reported</th><th className="px-5 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
                <td className="px-5 py-3"><div className="font-medium">{u.name}</div><div className="text-xs text-subtle">{u.email}</div></td>
                <td className="px-3">{u.role}{u.businessProfile?.isVerified ? " ✓" : ""}</td>
                <td className="px-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="px-3 tabular-nums">{u._count.listings}</td>
                <td className="px-3 tabular-nums">{u._count.roommateRequests}</td>
                <td className="px-3 tabular-nums">{u._count.reportsReceived || "—"}</td>
                <td className="px-5 text-right"><UserActions id={u.id} role={u.role} active={u.isActive} verified={u.businessProfile?.isVerified ?? false} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
