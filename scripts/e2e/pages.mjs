/**
 * Opens every main page as a visitor, a student, a business and an admin, and fails on server
 * errors, missing content or browser console errors. With --shots it also saves the report
 * screenshots into docs/screenshots/.
 *
 *   npm run test:pages                 # check only
 *   npm run docs:screenshots           # check + screenshots
 */
import path from "node:path";
import { BASE, launch, login, newSession } from "./browser.mjs";

const SHOTS = process.argv.includes("--shots");
const OUT = path.resolve("docs", "screenshots");
const DEMO = "NiraDemo#2026"; // seeded demo password (README)
const problems = [];
let pages = 0;

async function visit(page, who, url, { file, check, full = false, wait = 1500 } = {}) {
  const res = await page.goto(BASE + url, { waitUntil: "load", timeout: 120_000 });
  // Sections such as "nearby essentials" may still be fetching live map data; that must not
  // fail the page, so wait for the network to settle for at most 30 s.
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => undefined);
  await new Promise((r) => setTimeout(r, wait));
  const text = await page.evaluate(() => document.body.innerText);
  const status = res?.status() ?? 0;
  const ok = status < 500 && !/Something went wrong/i.test(text) && (!check || check.test(text));
  pages++;
  console.log(`${ok ? "ok  " : "FAIL"} ${String(status).padEnd(3)} ${who.padEnd(8)} ${url}`);
  if (!ok) problems.push(`${who} ${url}: status ${status}${check && !check.test(text) ? `, missing ${check}` : ""}`);
  if (SHOTS && file) await page.screenshot({ path: path.join(OUT, file), fullPage: full });
}

async function as(browser, who, email, password, fn) {
  const { ctx, page } = await newSession(browser);
  page.on("pageerror", (e) => problems.push(`${who} pageerror on ${page.url()}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/tile|favicon|Failed to load resource/i.test(m.text())) problems.push(`${who} console on ${page.url()}: ${m.text().slice(0, 160)}`);
  });
  if (email && !(await login(page, email, password))) throw new Error(`could not log in as ${email}`);
  await fn(page);
  await ctx.close();
}

const browser = await launch();
try {
  await as(browser, "visitor", null, null, async (p) => {
    await visit(p, "visitor", "/", { check: /Nira/ });
    await visit(p, "visitor", "/guide?q=" + encodeURIComponent("my landlord wants money before I move in, is that normal") + "&mode=ask", { file: "guide-ask.png", check: /% match/ });
    await visit(p, "visitor", "/guide/ch", { check: /SIM|Emergency/i });
    await visit(p, "visitor", "/guide/in", { check: /Jio|Airtel/ });
    await visit(p, "visitor", "/relocate?all=1", { check: /places?/ });
    await visit(p, "visitor", "/listings/1", { check: /month/ });
    await visit(p, "visitor", "/compare");
    await visit(p, "visitor", "/credits", { check: /Wikimedia/ });
  });

  await as(browser, "student", "meera@nira.app", DEMO, async (p) => {
    await visit(p, "student", "/relocate/home", { file: "destination.png", check: /Dublin/, wait: 3000 });
    await visit(p, "student", "/relocate?cityId=57566&city=" + encodeURIComponent("Dublin, Ireland") + "&q=" + encodeURIComponent("quiet room with a desk to study") + "&smart=true", { file: "search-smart.png", check: /Smart match/ });
    await visit(p, "student", "/roommates", { file: "roommates.png", check: /match/i });
    await visit(p, "student", "/essentials", { file: "essentials.png", wait: 4000 });
    await visit(p, "student", "/trip", { check: /Dublin weekend before term/ });
    const trip = await p.$eval('a[href^="/trip/"]:not([href="/trip/new"])', (a) => a.getAttribute("href")).catch(() => null);
    if (trip) await visit(p, "student", trip, { file: "trip.png", check: /budget/i, wait: 3000 });
    else problems.push("student: no trip on /trip");
    await visit(p, "student", "/trip/new", { check: /budget/i });
    await visit(p, "student", "/guide/ie", { check: /Leap|SIM/ });
    await visit(p, "student", "/chat");
    await visit(p, "student", "/saved");
    await visit(p, "student", "/profile");
    await p.goto(BASE + "/business", { waitUntil: "load" });
    if (new URL(p.url()).pathname.startsWith("/business")) problems.push("student could open /business");
    else console.log("ok      student  /business is blocked for this role");
  });

  await as(browser, "business", "hello@alpinestudent.ch", DEMO, async (p) => {
    await visit(p, "business", "/business", { file: "business-dashboard.png", check: /views/i, wait: 2500 });
    await visit(p, "business", "/business/listings/new", { file: "listing-form.png", full: true, check: /shar/i });
    await p.goto(BASE + "/business", { waitUntil: "load" });
    const req = await p.$$eval('a[href*="/requests"]', (as) => as.map((a) => a.getAttribute("href"))[0] ?? null);
    if (req) await visit(p, "business", req, { file: "requests.png", check: /request/i });
  });

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await as(browser, "admin", process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, async (p) => {
      await visit(p, "admin", "/admin", { file: "admin.png", check: /users/i, wait: 2500 });
      for (const u of ["/admin/users", "/admin/listings", "/admin/reports", "/admin/content"]) await visit(p, "admin", u);
    });
  } else console.log("skip admin: ADMIN_EMAIL / ADMIN_PASSWORD not set");
} catch (e) {
  problems.push("crashed: " + e.message);
} finally {
  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s):\n` + problems.join("\n") : `\nAll ${pages} pages OK, no browser errors.`);
  process.exitCode = problems.length ? 1 : 0;
}
