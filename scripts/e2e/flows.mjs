/**
 * End-to-end test of the main write flows against a running app, with throwaway accounts that
 * are deleted at the end (their listing, requests and chats go with them).
 *
 *   npm run start          (or npm run dev) in one terminal, then
 *   npm run test:e2e
 *
 * Covers: validation, UNIQUE email, role-based access, listing CHECK rules, fn_spots_left,
 * the one-open-request rule, chat (MySQL header + MongoDB bodies), the accept transaction with
 * row lock, the RENTED trigger, the audit-log trigger, smart (vector) search and ON DELETE CASCADE.
 */
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { api, launch, login, newSession } from "./browser.mjs";

const prisma = new PrismaClient();
const tag = Date.now().toString(36);
const password = "E2e-" + crypto.randomBytes(9).toString("base64url") + "#7";
const people = {
  owner: { name: "E2E Dorm Owner", email: `e2e-owner-${tag}@example.test`, role: "BUSINESS" },
  s1: { name: "E2E Student One", email: `e2e-s1-${tag}@example.test`, role: "USER" },
  s2: { name: "E2E Student Two", email: `e2e-s2-${tag}@example.test`, role: "USER" },
};
const results = [];
const check = (label, ok, detail = "") => {
  results.push(Boolean(ok));
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
};
const one = async (query, ...params) => {
  const rows = await prisma.$queryRawUnsafe(query, ...params);
  const v = rows[0] ? Object.values(rows[0])[0] : null;
  return typeof v === "bigint" ? Number(v) : v;
};

const browser = await launch();
try {
  const { page: visitor } = await newSession(browser);
  const short = await api(visitor, "POST", "/api/signup", { name: "Shorty", email: `e2e-short-${tag}@example.test`, password: "abc12", role: "USER" });
  check("sign-up rejects a 5-character password", short.status === 400, short.data?.error);
  for (const p of Object.values(people)) {
    const r = await api(visitor, "POST", "/api/signup", { name: p.name, email: p.email, password, role: p.role });
    check(`sign-up ${p.role === "USER" ? "personal" : "business"} account`, r.status === 201, `status ${r.status}`);
  }
  const dup = await api(visitor, "POST", "/api/signup", { name: "Dup", email: people.s1.email, password, role: "USER" });
  check("duplicate email is refused (UNIQUE)", dup.status === 409, dup.data?.error);

  const { page: owner } = await newSession(browser);
  const { page: s1 } = await newSession(browser);
  const { page: s2 } = await newSession(browser);
  check("business can log in", (await login(owner, people.owner.email, password))?.role === "BUSINESS");
  check("students can log in", (await login(s1, people.s1.email, password))?.role === "USER" && (await login(s2, people.s2.email, password))?.role === "USER");

  const notBiz = await api(s1, "POST", "/api/listings", { title: "nope" });
  check("a student cannot create listings (403)", notBiz.status === 403);

  const cityId = await one("SELECT c.id FROM City c JOIN Country co ON co.id = c.countryId WHERE co.isoCode = 'IE' AND c.name = 'Dublin' LIMIT 1");
  const created = await api(owner, "POST", "/api/listings", {
    title: "E2E twin room in a shared student house", description: "Two beds, quiet street, bike storage and a big kitchen.",
    type: "SHARED_ROOM", address: "1 Test Lane, Dublin 4", cityId, lat: 53.33, lng: -6.23, price: 700, currency: "EUR",
    isShareable: true, capacityMin: 1, capacityMax: 2, currentOccupants: 0, furnished: true,
  });
  const listingId = created.data?.id;
  check("business creates a shared listing (2 spots)", created.status === 201 && listingId, `id ${listingId}`);
  const badCap = await api(owner, "PATCH", `/api/listings/${listingId}`, { currentOccupants: 5 });
  check("occupants > capacity is rejected", badCap.status === 400, badCap.data?.error);
  check("spots left = 2 (fn_spots_left in v_listing_summary)", (await one("SELECT spotsLeft FROM v_listing_summary WHERE id = ?", listingId)) === 2);

  const r1 = await api(s1, "POST", `/api/listings/${listingId}/requests`, { message: "Hi, I start at UCD in January and I'm tidy.", budgetShare: 350 });
  const r1b = await api(s1, "POST", `/api/listings/${listingId}/requests`, { message: "Asking a second time on purpose.", budgetShare: 350 });
  const r2 = await api(s2, "POST", `/api/listings/${listingId}/requests`, { message: "Exchange student, quiet and friendly.", budgetShare: 350 });
  check("student 1 asks to share", r1.status === 201);
  check("a second open request by the same person is refused", r1b.status === 409, r1b.data?.error);
  check("student 2 asks to share", r2.status === 201);

  const chat = await api(s1, "POST", "/api/chat", { listingId, text: "Hello! Is the room still free in January?" });
  check("student starts a chat about the listing", chat.status === 201, `conversation ${chat.data?.conversationId}`);
  const reply = await api(owner, "POST", `/api/chat/${chat.data?.conversationId}/messages`, { text: "Yes, it is. Happy to show you around." });
  check("owner replies", reply.status === 201 || reply.status === 200, `status ${reply.status}`);
  const unread = await api(s1, "GET", "/api/chat/unread");
  check("student sees an unread message (MongoDB)", unread.data?.messages >= 1, JSON.stringify(unread.data));

  const reqs = await api(owner, "GET", `/api/listings/${listingId}/requests`);
  const ids = (reqs.data?.items ?? []).map((x) => x.id);
  const a1 = await api(owner, "PATCH", `/api/requests/${ids[0]}`, { action: "accept" });
  check("owner accepts the first request (transaction)", a1.data?.status === "MATCHED", JSON.stringify(a1.data));
  check("occupancy goes up to 1", (await one("SELECT currentOccupants FROM Listing WHERE id = ?", listingId)) === 1);
  const a2 = await api(owner, "PATCH", `/api/requests/${ids[1]}`, { action: "accept" });
  check("accepting the last spot fills the place", a2.data?.listingFull === true, JSON.stringify(a2.data));
  check("full listing becomes RENTED (trigger)", (await one("SELECT status FROM Listing WHERE id = ?", listingId)) === "RENTED");
  check("status change is in the audit log (trigger)", (await one("SELECT COUNT(*) FROM AuditLog WHERE tableName = 'Listing' AND rowId = ?", listingId)) >= 1);
  const again = await api(owner, "PATCH", `/api/requests/${ids[0]}`, { action: "accept" });
  check("a matched request can't be accepted twice", again.status >= 400, again.data?.error);

  await new Promise((r) => setTimeout(r, 4000)); // the vector is written in the background
  const smart = await api(s1, "GET", `/api/listings?q=${encodeURIComponent("twin room with bike storage")}&smart=true`);
  check("smart (vector) search answers", smart.status === 200 && ["smart", "fallback"].includes(smart.data?.matchMode), `mode ${smart.data?.matchMode}`);

  const wrong = await api(owner, "DELETE", "/api/account", { password: "not-the-password" });
  check("account deletion needs the right password", wrong.status === 400);
  for (const [page, who] of [[s1, "student 1"], [s2, "student 2"], [owner, "owner"]]) {
    const d = await api(page, "DELETE", "/api/account", { password });
    check(`delete ${who}'s account`, d.status === 200);
  }
  check("listing removed with its owner (ON DELETE CASCADE)", (await one("SELECT COUNT(*) FROM Listing WHERE id = ?", listingId)) === 0);
  await prisma.$executeRawUnsafe("DELETE FROM AuditLog WHERE tableName = 'Listing' AND rowId = ?", listingId);
} catch (e) {
  check("flow crashed", false, e.message);
} finally {
  // never leave test accounts behind, even after a failure
  await prisma.user.deleteMany({ where: { email: { endsWith: `${tag}@example.test` } } }).catch(() => undefined);
  await browser.close();
  await prisma.$disconnect();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exitCode = failed ? 1 : 0;
}
