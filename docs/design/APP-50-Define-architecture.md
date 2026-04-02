## APP-50 Define architecture

### Goals
- Make it clear how the app is structured end-to-end (frontend -> API -> database -> 3rd-party services).
- Ensure security boundaries are explicit for “public use” (no secrets; no trust in the client for authZ).

### Recommended high-level architecture (implementation-agnostic)
- Frontend: Next.js (App Router) renders UI and calls backend endpoints.
- Backend/API:
  - Prefer server-side route handlers (Next.js `app/api/*`) for trusted operations.
  - Use Supabase for database + auth + row-level security.
  - Use Stripe for payments and webhooks for confirmation events.
  - Use Supabase Storage for image uploads.
- Data:
  - PostgreSQL (via Supabase) stores users, restaurants, listings, inventory, reservations/orders, pickup windows, donation partners/claims, and an event log.

### Trusted vs untrusted boundaries
- Client is untrusted:
  - Never accept “admin=true” or “restaurant_id=…” from the client.
- Server is trusted:
  - Derive the acting user from Supabase session/jwt on the server.
  - Enforce restaurant ownership and admin permissions server-side and via RLS.

### Event-driven considerations
- Payment confirmation and fulfillment are asynchronous:
  - Stripe webhook marks reservation/payment success.
  - Pickup confirmation updates reservation status.
  - Donation fallback can be triggered by a cutoff scheduler/job.

### Public-safe deliverable note
This doc avoids any secrets and describes only patterns, boundaries, and schema-level security (RLS). Any sensitive values must remain in environment variables and never be committed.

