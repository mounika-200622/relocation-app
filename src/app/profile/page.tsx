import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { pageUser } from "@/lib/session";
import { loadProfileData } from "@/lib/profile-data";
import { ProfileForm } from "@/components/profile-form";
import { PageHeader } from "@/components/ui/misc";
import { BusinessProfileForm } from "./business-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await pageUser();
  if (user.role === "BUSINESS") {
    const bp = await prisma.businessProfile.findUnique({ where: { userId: user.id }, select: { displayName: true, description: true, isVerified: true } });
    return (
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8">
        <PageHeader title="Business profile" description="This is what people see on your listings. Your email is never shown — renters contact you through Nira chat." />
        <BusinessProfileForm initial={{ displayName: bp?.displayName ?? user.name, description: bp?.description ?? "" }} verified={bp?.isVerified ?? false} />
      </div>
    );
  }
  const initial = await loadProfileData(user.id);
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <PageHeader title="Your profile" description="Used to pre-fill searches and compute roommate compatibility. Other people only see your name, occupation and bio." />
      <div className="card p-6 md:p-8"><ProfileForm initial={initial} /></div>
    </div>
  );
}
