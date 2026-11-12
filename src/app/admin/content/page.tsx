import type { Metadata } from "next";
import { ENTITIES } from "@/lib/admin-entities";
import { PageHeader } from "@/components/ui/misc";
import { ContentEditor } from "./editor";

export const metadata: Metadata = { title: "Guide & costs · Admin" };

export default async function AdminContent({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const def = ENTITIES.find((e) => e.key === type) ?? ENTITIES[0]!;
  return (
    <div>
      <PageHeader title="Guide & cost content" description="Everything in the settling-in guide and the cost estimates lives in these tables. Nothing is hard-coded in the pages." />
      <ContentEditor entities={ENTITIES.map((e) => ({ key: e.key, label: e.label }))} def={def} />
    </div>
  );
}
