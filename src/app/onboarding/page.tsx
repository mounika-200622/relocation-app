import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadProfileData } from "@/lib/profile-data";
import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "USER") redirect(session.user.role === "BUSINESS" ? "/business" : "/admin");
  const [initial, { next }] = await Promise.all([loadProfileData(session.user.id), searchParams]);
  return <OnboardingWizard initial={initial} name={session.user.name ?? ""} next={next} />;
}
