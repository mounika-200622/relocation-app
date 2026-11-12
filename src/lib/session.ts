import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/lib/authz";

/** Server-component guard (the proxy already redirects; this keeps types non-null). */
export async function pageUser(roles?: AppRole[]) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (roles && !roles.includes(session.user.role)) redirect("/");
  return { id: session.user.id, role: session.user.role, name: session.user.name ?? "" };
}
