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

### Web browser (all platforms—easiest)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use responsive mode in your browser devtools for a quick mobile layout check.

---

### macOS + Xcode (iOS Simulator)

**Prerequisites:** Xcode with iOS Simulator, CocoaPods (`sudo gem install cocoapods` if the iOS project asks for it).

**One-time native project:**

```bash
npm install
npm run mobile:ios:add
npm run mobile:sync
npm run mobile:ios:open
```

In Xcode, pick a simulator (for example iPhone 16) and press Run. After that, prefer the live-reload flow below.

**Live reload (recommended):** the app loads your machine’s dev server via `CAP_SERVER_URL` (set in the `ios` / `android` run scripts).

Terminal A (dev server bound to all interfaces so devices/simulators can reach it):

```bash
npm run dev:mobile
```

Terminal B (build, sync, run simulator with live server URL):

```bash
npm run ios
```

Equivalent: `npm run mobile:ios:run` (same as `ios`).

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

Terminal A:

```bash
npm run dev:mobile
```

Terminal B:

```bash
npm run android
```

(`android` runs `mobile:android:run` with `CAP_SERVER_URL=http://localhost:3000`.)

---

### Physical devices

The simulator scripts use `http://localhost:3000`, which **does not** resolve to your computer from a physical phone. Use your machine’s **LAN IP** instead.

1. Start the dev server: `npm run dev:mobile`
2. From the project root, run Capacitor with a custom URL (example IP—replace with yours):

```bash
# iOS device (macOS + Xcode) — replace the IP with your machine’s LAN address
npx cross-env CAP_SERVER_URL=http://192.168.1.10:3000 npx cap run ios -l --external

# Android device
npx cross-env CAP_SERVER_URL=http://192.168.1.10:3000 npx cap run android -l --external
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
