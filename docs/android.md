# Running Nira on Android (and any phone)

Nira is a full-stack app: the Next.js server talks to MySQL and MongoDB. A phone therefore
runs the **Nira app shell** (Capacitor, in `android/`) that opens your running Nira server.
Everything works on the phone: login, search, maps, chat, roommates, guide, trips, admin — plus
**native GPS** (the `@capacitor/geolocation` plugin) for the "You're here" panel, and the
hardware **Back** button goes to the previous page (`@capacitor/app`).

There are two ways to use it on a phone:

| | Installable web app (PWA) | Android app (Capacitor) |
|---|---|---|
| What | "Add to Home screen" from Chrome | A real APK built with Android Studio |
| Setup | none | build once |
| Feels like | full-screen app with icon and splash | full-screen app with icon and splash |

## 1. Start the server so the phone can reach it

The phone and the laptop must be on the **same Wi-Fi**.

1. Find the laptop's Wi-Fi IP (Windows: `ipconfig` → "Wireless LAN adapter Wi-Fi" → IPv4, e.g. `192.168.2.100`).
2. In `.env` set `NIRA_DEV_ORIGINS="192.168.2.100"` and make sure `NEXTAUTH_URL` is **not** set
   (`AUTH_TRUST_HOST=true` lets login work on any host).
3. Start the databases and the server on all network interfaces:

```bash
npm run dev:lan
```

   or, faster, a production build:

```bash
npm run build
```

```bash
npm run start:lan
```

4. Allow Node.js through the Windows firewall when asked (Private networks).
5. On the phone's browser open `http://192.168.2.100:3000` to check it works.

## 2a. Installable web app (no build)

On the phone in Chrome: open `http://<laptop-ip>:3000` → menu ⋮ → **Add to Home screen**.
(Chrome only offers the full "Install app" prompt on HTTPS; over plain HTTP on the LAN
"Add to Home screen" still gives a full-screen icon.)

## 2b. Android app over Wi-Fi — one command (recommended)

Prerequisites: Android Studio (with SDK), JDK 21 (`JAVA_HOME`). With the server running
(`npm run start:lan`):

```bash
npm run android:wifi
```

This finds the laptop's Wi-Fi IP, syncs Capacitor with `NIRA_SERVER_URL=http://<ip>:3000`,
builds the debug APK and copies it to **`Nira-debug.apk`** in the project folder. Send that file
to the phone (WhatsApp/Drive/USB), open it and allow "install unknown apps" once. To install over
USB/adb instead:

```bash
npm run android:wifi -- --install
```

No cable is needed afterwards: the phone only has to be on the same Wi-Fi as the laptop. The
address is baked into the APK, so **re-run the command if the laptop moves to another network**.
If the server can't be reached (phone on mobile data, server stopped), the app shows a "Can't
reach the Nira server" page with the steps and a **Try again** button instead of a blank screen:
Capacitor's `errorPath` covers connection errors, and `MainActivity` switches to it when the first
page hasn't loaded after 15 s (mobile networks silently drop 192.168.x.x traffic). The page is
generated at sync time from `mobile/offline.template.html` with the server URL filled in.

## 2c. Android app with Android Studio (manual)

```bash
set NIRA_SERVER_URL=http://192.168.2.100:3000
```

```bash
npx cap sync android
```

```bash
npx cap open android
```

In Android Studio: wait for Gradle sync → pick your phone (USB debugging on) or an emulator →
**Run ▶**. To get an APK file: *Build → Build App Bundle(s) / APK(s) → Build APK(s)*; the file
is `android/app/build/outputs/apk/debug/app-debug.apk` — copy it to the phone and install.

From the command line instead:

```bash
npm run android:apk
```

### Emulator

The Android emulator reaches the laptop at `10.0.2.2`, which is the default in
`capacitor.config.ts`, so for the emulator just run `npx cap sync android` without
`NIRA_SERVER_URL`.

### Deployed server

If Nira is deployed (e.g. `https://nira.example.com`), set `NIRA_SERVER_URL` to that URL,
`npx cap sync android`, and build — the app then works anywhere, not just on your Wi-Fi.

## Troubleshooting

| Symptom | Fix |
|---|---|
| App shows "Can't reach the Nira server" | Phone Wi-Fi off / on mobile data, the laptop IP changed, or the server isn't running with `:lan`. Join the same Wi-Fi, run `npm run start:lan`, and re-run `npm run android:wifi` if the IP changed. |
| "Couldn't get your location" | Turn on Location in the phone's quick settings and allow it for Nira — or tap **or pick a city**. |
| Gradle: "Unsupported class file major version 69" | Gradle is using Java 25 (Android Studio's bundled JBR). Point `JAVA_HOME` at JDK 21. |
| Page loads but buttons do nothing (dev mode) | Add the laptop IP to `NIRA_DEV_ORIGINS` and restart `npm run dev:lan`. |
| Login works, logout goes to a blank page | Remove `NEXTAUTH_URL` from `.env`. |
| Phone can't connect at all | Windows firewall: allow Node.js on Private networks; both devices on the same Wi-Fi (not guest network). |
