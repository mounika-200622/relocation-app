/**
 * Builds (and optionally installs) the Android app for a phone on the same Wi-Fi as this laptop.
 *
 *   npm run android:wifi            → build android/app/build/outputs/apk/debug/app-debug.apk + copy to ./Nira-debug.apk
 *   npm run android:wifi -- --install   → also install on the phone connected with USB / adb wireless
 *
 * The app loads the Nira server running on this laptop (`npm run start:lan`), so the APK has the
 * laptop's Wi-Fi address baked in. Re-run this whenever the laptop joins a different network.
 * Override detection with NIRA_SERVER_URL=http://x.x.x.x:3000.
 */
import { networkInterfaces } from "node:os";
import { execSync } from "node:child_process";
import { copyFileSync } from "node:fs";
import { join } from "node:path";

const PORT = process.env.PORT || "3000";

function isPrivate(ip) {
  return /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

function wifiAddress() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family !== "IPv4" || a.internal || !isPrivate(a.address)) continue;
      // VirtualBox/Hyper-V host-only adapters are not reachable from a phone
      if (/virtual|vEthernet|vbox|docker|wsl/i.test(name) || a.address.startsWith("192.168.56.")) continue;
      candidates.push({ name, address: a.address, wifi: /wi-?fi|wlan|wireless/i.test(name) });
    }
  }
  candidates.sort((a, b) => Number(b.wifi) - Number(a.wifi));
  return candidates[0]?.address;
}

const serverUrl = process.env.NIRA_SERVER_URL || (wifiAddress() ? `http://${wifiAddress()}:${PORT}` : null);
if (!serverUrl) {
  console.error("Could not find this laptop's Wi-Fi address. Connect to Wi-Fi or set NIRA_SERVER_URL.");
  process.exit(1);
}
console.log(`Phone app will load ${serverUrl}  (start the server with: npm run start:lan)`);

const run = (cmd, cwd = process.cwd()) => execSync(cmd, { stdio: "inherit", cwd, env: { ...process.env, NIRA_SERVER_URL: serverUrl } });
const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const android = join(process.cwd(), "android");

run("npx cap sync android");
run(`${gradlew} assembleDebug`, android);
const apk = join(android, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
copyFileSync(apk, "Nira-debug.apk");
console.log(`APK ready: ${join(process.cwd(), "Nira-debug.apk")}`);
if (process.argv.includes("--install")) run(`${gradlew} installDebug`, android);
