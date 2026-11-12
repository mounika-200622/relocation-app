import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android app shell for Nira.
 *
 * Nira is a full-stack app (Next.js server + MySQL + MongoDB), so the Android app loads
 * the running Nira server instead of bundling static files:
 *   - Android emulator  → http://10.0.2.2:3000   (the emulator's alias for your laptop)
 *   - Real phone on Wi-Fi → http://<your-laptop-LAN-IP>:3000
 *   - Deployed           → https://your-domain
 * Set NIRA_SERVER_URL before `npx cap sync android` to change it. See docs/android.md.
 */
const serverUrl = process.env.NIRA_SERVER_URL ?? "http://10.0.2.2:3000";

const config: CapacitorConfig = {
  appId: "app.nira.relocation",
  appName: "Nira",
  webDir: "mobile/www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"), // allow plain HTTP only for local development
    androidScheme: "https",
  },
  plugins: {
    // light status-bar icons on the dark theme; insets reach CSS as env(safe-area-inset-*)
    SystemBars: { insetsHandling: "css", style: "DARK", initialViewportFitValueHint: "cover" },
  },
  android: {
    backgroundColor: "#0e0810",
    allowMixedContent: false,
  },
};

export default config;
