# Contributing to NoWaste

## Workflow (avoid painful merges)

Long-running feature branches that drift from `main` tend to pick up merge conflicts in shared files (`order-store`, API routes, `README`, native projects). To keep work mergeable:

1. **Branch from an up-to-date `main`** (or your integration branch) and **merge or rebase `main` often**—at least every few commits on shared code.
2. **Keep PRs focused**: one theme per branch (for example “restaurant reservations API” *or* “Capacitor iOS polish”, not both in one giant PR).
3. **Isolate native churn**: changes under `ios/` or `android/` are conflict-prone. Commit them separately when possible so web PRs stay easy to review.
4. **Before you push**: `npm run lint && npm test && npm run typecheck && npm run build`.

---

## Platform-specific development

NoWaste is a **Next.js web app** wrapped with **Capacitor** for native shells. It is **not** an Expo project—there is no Expo Go, and `npm run dev` does **not** offer interactive `i` / `a` / `w` keys (that behavior is Expo CLI). Use the commands below instead.

**Port for all mobile scripts:** set **`MOBILE_DEV_PORT`** or **`MOBILE_PORT`** (default **3000**) so `dev:mobile`, `npm run ios` / `android`, and `sim:*` stay aligned. Example: `MOBILE_DEV_PORT=3001 npm run sim:ios`.

**Capacitor `webDir`:** the repo uses **`www/`** with a minimal **`index.html`** because Capacitor requires that file at the sync root; Next’s **`.next`** build output does not provide it. In development, **`CAP_SERVER_URL`** / **`server.url`** loads the Next app from your dev server inside the WebView.

### Web browser (all platforms—easiest)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use responsive mode in your browser devtools for a quick mobile layout check.

---

### macOS + Xcode (iOS Simulator)

**Prerequisites:** Xcode with iOS Simulator, CocoaPods (`sudo gem install cocoapods` if the iOS project asks for it).

**`mobile:sync` / `pod install` needs full Xcode, not only Command Line Tools.** If Capacitor fails with:

`xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance`

then macOS is using the CLT bundle instead of **Xcode.app**. Fix it (after installing Xcode from the App Store if needed):

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
xcodebuild -version
```

Open **Xcode** once so it can finish installing components, then run `npm run mobile:sync` again.

**One-time native project:**

```bash
npm install
npm run mobile:ios:add
npm run mobile:sync
npm run mobile:ios:open
```

In Xcode, pick a simulator (for example iPhone 16) and press Run. After that, prefer the live-reload flow below.

**Live reload (recommended):** the app loads your machine’s dev server via `CAP_SERVER_URL` (set in the `ios` / `android` run scripts).

**Easiest — one terminal:** starts the dev server, **waits until `http://127.0.0.1:3000` returns a real HTTP response** (so slow Next compiles do not race the simulator), then opens the iOS Simulator.

```bash
npm run mobile:ios:dev
# same as:
npm run sim:ios
```

If tooling looks wrong, run `npm run mobile:doctor` (`npx cap doctor`).

**Or two terminals:** Terminal A — dev server bound to all interfaces so the simulator can reach it:

```bash
npm run dev:mobile
```

Terminal B — run the native shell against the live server:

```bash
npm run ios
```

Equivalent: `npm run mobile:ios:run` (same as `ios`). After changing `capacitor.config.ts`, run `npx cap sync ios` (or `npm run mobile:sync`) once.

---

### Windows / Linux

**Option 1 — Web (simplest):** same as [Web browser](#web-browser-all-platformseasiest) above.

**Option 2 — Android Emulator (Android Studio):** add the native project once, then sync and run.

```bash
npm install
npm run mobile:android:add
npm run mobile:sync
npm run mobile:android:open
```

Then use Android Studio to run an emulator, or:

**One terminal** (same HTTP-ready wait as iOS):

```bash
npm run mobile:android:dev
# same as:
npm run sim:android
```

**Or two terminals:** A — `npm run dev:mobile`, B — `npm run android` (`CAP_SERVER_URL` is set from `MOBILE_DEV_PORT` / `MOBILE_PORT`, default `http://localhost:3000`).

---

### Physical devices

`localhost` inside the native app is the **phone**, not your Mac/PC. Use your machine’s **LAN IP** and the **same port** as `MOBILE_DEV_PORT` (default **3000**).

1. Start the dev server: `npm run dev:mobile` (or `MOBILE_DEV_PORT=3001 npm run dev:mobile` if you use another port).
2. From the project root, run Capacitor with that URL (replace IP and port):

```bash
# macOS / Linux — iOS device (Xcode)
CAP_SERVER_URL=http://192.168.1.10:3000 npx cap run ios -l --external

# macOS / Linux — Android device
CAP_SERVER_URL=http://192.168.1.10:3000 npx cap run android -l --external
```

```powershell
# Windows PowerShell (Android — iOS requires macOS + Xcode)
$env:CAP_SERVER_URL="http://192.168.1.10:3000"; npx cap run android -l --external
```

Phone and computer must be on the **same Wi‑Fi**. For iOS, if you use `http://`, ensure `capacitor.config.ts` keeps **cleartext** enabled for that URL (already the case for `http://` server URLs).

---

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

---

## Environment

Copy `.env.example` to `.env.local` and fill required values (see [README](./README.md) for keys and troubleshooting).
