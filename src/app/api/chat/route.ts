import { enforceRateLimit, json, readJson, requireUser, route } from "@/lib/api";
import { inbox, startConversation } from "@/lib/chat";
import { startChatSchema } from "@/lib/validators/social";

/** Inbox: other person, listing, last message, unread count (MongoDB aggregation). */
export const GET = route(async () => {
  const user = await requireUser();
  return json({ items: await inbox(user.id) });
});

/** Start (or reopen) a conversation – either side can start it. */
export const POST = route(async (req) => {
  const user = await requireUser();
  enforceRateLimit(`chat-start:${user.id}`, 20, 60_000);
  const input = await readJson(req, startChatSchema);
  const conversationId = await startConversation(user, input);
  return json({ conversationId }, 201);
});
