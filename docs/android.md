# Running Nira on Android (and any phone)

Nira is a full-stack app: the Next.js server talks to MySQL and MongoDB. A phone therefore
runs the **Nira app shell** (Capacitor, in `android/`) that opens your running Nira server.
Everything works on the phone: login, search, maps, chat, roommates, guide, trips, admin.

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

## 2b. Android app with Android Studio

Prerequisites: Android Studio (with SDK), JDK 21.

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
| App shows "Can't reach the Nira server" | The laptop IP changed or the server isn't running with `:lan`. Re-run `npx cap sync android` with the new `NIRA_SERVER_URL`. |
| Page loads but buttons do nothing (dev mode) | Add the laptop IP to `NIRA_DEV_ORIGINS` and restart `npm run dev:lan`. |
| Login works, logout goes to a blank page | Remove `NEXTAUTH_URL` from `.env`. |
| Phone can't connect at all | Windows firewall: allow Node.js on Private networks; both devices on the same Wi-Fi (not guest network). |
