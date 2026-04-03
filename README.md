# NoWaste

NoWaste is a Next.js app for reducing food waste by connecting surplus restaurant inventory to customers.

## Current feature set

- Marketplace browse + listing detail + checkout entry
- Restaurant listings operations hub:
  - create listings
  - search/filter listings
  - inline edit pricing and inventory
  - pause / activate / archive / delete listing lifecycle actions
- Orders center:
  - API-backed order history
  - status filters and search
  - cancellation action with server updates
  - pickup code confirmation flow

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Mobile simulator testing (same web app)

This repository currently runs as a responsive web app (no native shell required).
You can still test mobile UX quickly:

1. Start dev server: `npm run dev`
2. Open Chrome dev tools and use device emulation, or
3. Open iOS Simulator and browse to your machine IP:
   - `http://<your-lan-ip>:3000`
   - For best results run from the same Wi-Fi network.

If you want native packaging next, the next chunk can add Capacitor iOS integration on top of this branch.