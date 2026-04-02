## APP-57 Document architecture decisions

### Decision log (MVP recommendations)
1. Backend platform: `Supabase` (Postgres + Auth + RLS + Storage)
2. Trusted API surface: Next.js server route handlers for privileged actions
3. Auth: Supabase Auth + application role stored in a profile table
4. Maps/location: geocoding + store coords, compute distance later/when needed
5. Payments: Stripe (server-created checkout session + webhook verified)
6. Notifications: email-first provider invoked by server handlers/jobs
7. Image storage: Supabase Storage with RLS + signed URLs (preferred)
8. Data consistency: state transitions tracked via event log + idempotent handlers

### Why these decisions are safe for public use
- No secrets in client code or committed files (use environment variables).
- Authorization is enforced server-side and with RLS policies (not in the UI).
- Stripe/payment outcomes are confirmed only from webhook events.
- Storage uses RLS so restaurants can’t access other restaurants’ media.

### Open questions
- Exact role assignment + onboarding flow (self-serve vs admin approval).
- Pickup confirmation responsibility (customer-only vs restaurant-only vs both).
- Whether customers can checkout without account.

