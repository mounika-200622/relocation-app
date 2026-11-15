// Shared helpers for the end-to-end scripts: env loading, a local Chrome/Edge, and API calls
// made from inside a logged-in page (so the session cookie is used exactly as in the app).
import fs from "node:fs";
import puppeteer from "puppeteer-core";

try {
  process.loadEnvFile(".env");
} catch {
  // no .env: rely on the real environment
}

export const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

export async function launch() {
  const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error("No Chrome or Edge found. Set CHROME_PATH to your browser's executable.");
  return puppeteer.launch({ executablePath, headless: true, args: ["--no-first-run", "--disable-extensions"] });
}

/** A fresh, isolated browser session (its own cookies) with a page on the app. */
export async function newSession(browser, { width = 1366, height = 860 } = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width, height });
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 120_000 });
  return { ctx, page };
}

export function api(page, method, url, body) {
  return page.evaluate(
    async (method, url, body) => {
      const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
      let data = null;
      try {
        data = await r.json();
      } catch {
        // not JSON
      }
      return { status: r.status, data };
    },
    method,
    url,
    body,
  );
}

/** Logs in through NextAuth's credentials endpoint; returns the session user or null. */
export async function login(page, email, password) {
  const csrf = await api(page, "GET", "/api/auth/csrf");
  await page.evaluate(
    async (csrfToken, email, password) => {
      await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, email, password, callbackUrl: "/" }),
        redirect: "manual",
      });
    },
    csrf.data.csrfToken,
    email,
    password,
  );
  const s = await api(page, "GET", "/api/auth/session");
  return s.data?.user ?? null;
}
