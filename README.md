# NoWaste

NoWaste is a full-stack Next.js app focused on reducing food waste by helping restaurants list surplus food, customers reserve pickups, and donation partners claim unsold inventory.

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
- `npm run dev:turbo` - start local dev server in Turbopack mode
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
- `GET /api/admin/reports/csv` - admin-only CSV export

## Repository Notes

- Branch protection on `main` requires PR review.
- Use feature/fix branches and open PRs into `main`.
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
