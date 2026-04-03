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

For local demos, `POST /api/auth/nw-session` with JSON such as `{ "role": "restaurant_staff", "restaurantId": "r1" }` sets matching cookies. In production the route requires `ALLOW_NW_SESSION_ISSUE=1` **and** header `x-nw-session-issue-secret` matching `NW_SESSION_ISSUE_SECRET`. Prefer issuing scope from your auth provider when user profiles store `restaurantId`.

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

## Platform-specific development (web, iOS, Android)

NoWaste ships as a **Next.js** app with optional **Capacitor** native shells. It is **not** Expo: `npm run dev` does not show `i` / `a` / `w` shortcuts (that is Expo CLI). Use the flows in **[CONTRIBUTING.md](./CONTRIBUTING.md)** instead.

| Goal | Command / flow |
|------|------------------|
| **Web (any OS)** | `npm run dev` → open http://localhost:3000 |
| **iOS Simulator (Mac + Xcode)** | Terminal A: `npm run dev:mobile` · Terminal B: `npm run ios` |
| **Android emulator** | One-time `npm run mobile:android:add`, then same two-terminal pattern with `npm run android` |
| **Physical device** | `npm run dev:mobile` plus `CAP_SERVER_URL=http://<your-LAN-IP>:3000` when running Capacitor (see Contributing) |

Short **merge-friendly workflow** tips for larger features are also in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Tech Stack

- `Next.js` (App Router, route handlers)
- `TypeScript`
- `React`
- `Tailwind CSS` (v4 via `@tailwindcss/postcss`)
- `Zod` + `react-hook-form`
- `Vitest` for tests
- `Supabase` (auth/data integration points)
- `Stripe` (checkout session integration)

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env.local` and set values:

```bash
cp .env.example .env.local
```

Required keys:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `AUTH_SESSION_SECRET`
- `EXPIRE_RESERVATIONS_SECRET`

## API Keys and Secrets

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Create/select a project in [Supabase](https://supabase.com/).
  - Go to Project Settings -> API.
  - Use Project URL for `NEXT_PUBLIC_SUPABASE_URL`.
  - Use anon/public key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- `STRIPE_SECRET_KEY`
  - Create/login to [Stripe](https://dashboard.stripe.com/).
  - Use Developers -> API keys -> Secret key (test key for local).

- `STRIPE_WEBHOOK_SECRET`
  - In Stripe Dashboard: Developers -> Webhooks, create an endpoint for `/api/stripe/webhook`.
  - Copy the endpoint signing secret into `STRIPE_WEBHOOK_SECRET`.
  - Local development: run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use the displayed signing secret.

- `AUTH_SESSION_SECRET`
  - Random 32+ byte secret used for server-side session signature checks.
  - Example generation: `openssl rand -hex 32`.

- `EXPIRE_RESERVATIONS_SECRET`
  - Random secret for the reservation expiration job endpoint auth header.
  - Example generation: `openssl rand -hex 32`.


### 3) Run locally

Default (stabilized) dev mode:

```bash
npm run dev
```

Optional Turbopack regression mode:

```bash
npm run dev:turbo
```

App runs at `http://localhost:3000`.

## Available Scripts

- `npm run dev` - start local dev server (Webpack mode)
- `npm run dev:mobile` - dev server on `0.0.0.0:3000` (for simulators / LAN devices)
- `npm run dev:turbo` - start local dev server in Turbopack mode
- `npm run ios` / `npm run android` - Capacitor live reload against `http://localhost:3000` (requires native project; see [CONTRIBUTING.md](./CONTRIBUTING.md))
- `npm run mobile:sync` - production build + `cap sync` (all added platforms)
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint codebase
- `npm run typecheck` - TypeScript checks
- `npm test` - run all tests
- `npm run test:unit` - unit tests (`src/lib`)
- `npm run test:component` - component tests (`src/components`)
- `npm run test:integration` - API/integration tests (`src/app/api`)
- `npm run test:ci` - CI-oriented test run

## Main Product Areas

- **Restaurant operations**
  - Dashboard
  - Create/manage listings
  - Pickup verification and audit views
- **Customer marketplace**
  - Browse/filter listings
  - Listing and restaurant detail pages
  - Checkout and order confirmation
- **Donation fallback**
  - Convert unsold listings to donation flow
  - Partner claim and handoff lifecycle
- **Admin/reporting**
  - Admin guarded pages
  - CSV export route for reporting

## Notable API Routes

- `POST /api/listings` - create listing (auth + role scoped)
- `POST /api/checkout/session` - create Stripe checkout session
- `POST /api/jobs/expire-reservations` - secure expiration job endpoint
- `POST /api/stripe/webhook` - Stripe event finalization for payment status
- `GET /api/orders/me` - customer-scoped order history from `nw-user-id` cookie
- `GET /api/admin/reports/csv` - admin-only CSV export

## Repository Notes

- Branch protection on `main` requires PR review.
- Use feature/fix branches and open PRs into `main`.
- Larger features: follow [CONTRIBUTING.md](./CONTRIBUTING.md) to reduce merge pain on shared files and native projects.
- Keep secrets only in `.env.local`; never commit secrets.


## Troubleshooting

- Dev server hangs or logs repeated `Can't resolve 'tailwindcss'`
  - Use the stabilized default: `npm run dev` (Webpack mode).
  - Turbopack remains available via `npm run dev:turbo` for regression checks.
  - Stop runaway dev processes before retrying:
    - `pkill -f "next dev"`

- Env-related startup/runtime errors
  - Confirm `.env.local` includes all required keys from this README.
  - Re-check variable names exactly (for example, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

- API routes returning `401`/`403` locally
  - Some routes are intentionally protected (admin/job endpoints).
  - Confirm required auth cookies/headers and secrets are set before testing those routes.

- Build/test drift
  - Run full local validation:
    - `npm run lint && npm test && npm run typecheck && npm run build`

## Verification Checklist

Before opening a PR:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```
