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
- Restaurant reservations queue (`/reservations`):
  - lists persisted checkouts for the scoped restaurant (staff) or a selected restaurant (admin via `?restaurantId=`)
  - mark **Picked up** or **No-show** (`PATCH /api/orders/{orderId}/fulfillment` with `{ "status": "picked_up" | "missed_pickup" }`)
  - new reservations store `restaurantId` / `restaurantName` on the order at checkout time

### Restaurant orders API (authenticated)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/orders/restaurant` | Staff: restaurant scope comes from the **signed** session (`nw-session-sig` covers `nw-restaurant-id`). Admin: requires `?restaurantId=<id>`. |
| `PATCH` | `/api/orders/{orderId}/fulfillment` | Body: `{ "status": "picked_up" }` or `{ "status": "missed_pickup" }`. Only while fulfillment is `reserved`. |

Signed session cookies (`nw-authenticated`, `nw-role`, optional `nw-restaurant-id`, and `nw-session-sig`) use `AUTH_SESSION_SECRET`. Staff cannot change `nw-restaurant-id` without invalidating the signature.

For local demos, `POST /api/auth/nw-session` with JSON such as `{ "role": "restaurant_staff", "restaurantId": "r1" }` sets matching cookies. In production that route is disabled unless `ALLOW_NW_SESSION_ISSUE=1`; prefer issuing scope from your auth provider when user profiles store `restaurantId`.

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