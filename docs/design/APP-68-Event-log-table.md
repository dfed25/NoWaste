## APP-68 Event log table

### Purpose
An append-only `event_log` captures “what happened” for orders/listings/pickup/donation so:
- you can audit state transitions
- you can build metrics safely
- you can debug webhook retries & pickup confirmation flows

### Table: `event_log`
#### Suggested columns
- `id` (uuid, PK)
- `actor_user_id` (uuid nullable; who triggered the event: customer/restaurant/admin/system)
- `entity_type` (text): e.g. `order`, `listing`, `pickup_window`, `donation_claim`
- `entity_id` (uuid): references the entity (enforced at app layer, or via multiple FKs)
- `event_type` (text enum or limited set):
  - `order.created`
  - `payment.succeeded`
  - `order.confirmed`
  - `pickup.confirmed`
  - `pickup.failed`
  - `donation.eligible`
  - `donation.assigned`
  - `donation.donated`
  - `donation.completed`
  - `listing.published`
  - `listing.expired`
- `event_payload` (jsonb nullable):
  - store non-sensitive details needed for debugging (avoid secrets and PII)
- `created_at` (timestamptz)

#### Indexes
- Index on `(entity_type, entity_id, created_at desc)`
- Index on `(event_type, created_at desc)`

### RLS policy intent
- Customers read events for their orders only.
- Restaurants read events for orders tied to their listings.
- Admin reads all.

### Security/public-safe note
- Keep `event_payload` free of Stripe secrets, webhook signatures, or internal tokens.

