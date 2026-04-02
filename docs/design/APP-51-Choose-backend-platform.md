## APP-51 Choose backend platform

### Recommended choice
Use **Supabase** as the backend platform.

### Why Supabase fits this product
- Postgres database with **Row Level Security (RLS)** for multi-tenant rules (restaurant-scoped data).
- Supabase Auth for login/session management.
- Supabase Storage for image uploads (restaurants + listings).
- Ability to run server-side logic via:
  - Next.js server route handlers (preferred for trusted API surface), and/or
  - Supabase Edge Functions / background jobs (optional for webhooks/schedulers).

### How responsibilities split (recommended)
- Next.js route handlers:
  - handle user-facing API requests from the UI
  - validate inputs
  - enforce authZ (role + ownership)
  - create Stripe Checkout sessions / PaymentIntents
- Supabase:
  - stores data + enforces RLS at query time
  - stores events and provides aggregated reporting queries
- Stripe webhooks:
  - update payment/reservation state asynchronously and securely

### Assumptions / questions
- Are you okay with Supabase-managed Postgres + RLS as the source of truth?
- Do you want all “scheduled jobs” to be in Next.js or use a Supabase function/cron approach?

