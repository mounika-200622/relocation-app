import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageUser } from "@/lib/session";
import { loadConversationFor } from "@/lib/chat";
import { Thread } from "./thread";

export const metadata: Metadata = { title: "Conversation" };

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await pageUser();
  const raw = (await params).id;
  const id = /^\d{1,10}$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  // 404 for missing *and* foreign conversations – never reveal other people's chats
  await loadConversationFor(id, user.id).catch(() => notFound());
  return <Thread conversationId={id} meId={user.id} />;
}
