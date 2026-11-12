import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { json, optionalUser, parseId, route } from "@/lib/api";
import { recordView } from "@/lib/listings";

type Ctx = { id: string };

/** Counts one view per visitor per day (anonymous visitors are a salted hash of IP + UA). */
export const POST = route<Ctx>(async (_req, { params }) => {
  const listingId = parseId((await params).id);
  const user = await optionalUser();
  const h = await headers();
  const who = user ? `u:${user.id}` : `a:${h.get("x-forwarded-for") ?? "local"}:${h.get("user-agent") ?? ""}`;
  const viewerKey = createHash("sha256").update(`${who}:${process.env.AUTH_SECRET ?? ""}`).digest("hex");
  await recordView(listingId, user?.id ?? null, viewerKey).catch(() => undefined); // unknown listing ids are ignored
  return json({ ok: true });
});
