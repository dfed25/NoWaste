## APP-58 Define database schema

### Database platform
PostgreSQL via Supabase.

### Guiding principles
- RLS-first: enforce authorization with Row Level Security on every tenant-sensitive table.
- State machine consistency:
  - reservations/orders move through well-defined statuses
  - state transitions are recorded in an event log (append-only)
- Idempotency everywhere:
  - Stripe webhooks can retry
  - pickup confirmation clicks can retry

### Naming conventions (suggested)
- Primary keys: `id` (uuid)
- Foreign keys: `*_id`
- Status fields:
  - use a limited set of values (`text` with check constraints or Postgres `enum`)

### Recommended core tables
- `app_users` (profile + role)
- `restaurants`
- `restaurant_hours`
- `listings` (surplus listings)
- `listing_inventory`
- `orders` (reservation/payment/fulfillment record; “order” is the reservation record)
- `pickup_windows`
- `donation_partners`
- `donation_claims`
- `event_log`

### Locked MVP policy mapping
- Guest checkout supported in `orders` with required guest fields.
- Restaurant onboarding uses `restaurants.approval_status` (`pending_approval`, `approved`, `rejected`).
- Pickup selection is window-based (`pickup_window_start`, `pickup_window_end`) with no minute-slot table.
- Consumer and donation flows are split by listing type.
- Donation eligibility is rule-based (unsold + fallback enabled + cutoff passed + within 30 minutes of closing).

### Relationships (high level)
- `listings` belongs to `restaurants`
- `listing_inventory` belongs to `listings`
- `orders` belongs to `listings` + `app_users` (customer) + optional `pickup_windows`
- `pickup_windows` belongs to `listings` (or to the listing’s scheduling config)
- `donation_claims` belongs to `orders` (or to listings+reservation context)
- `event_log` references the entity being updated (order/listing/etc)

### Security/public-safe notes
- Don’t expose admin reports directly without server-side/admin checks.
- Avoid storing sensitive PII in publicly readable tables.
- Use signed identifiers or short-lived tokens for pickup confirmation links.

