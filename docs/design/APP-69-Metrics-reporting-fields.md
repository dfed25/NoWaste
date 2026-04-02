## APP-69 Metrics/reporting fields

### Purpose
Make admin reporting fast and reliable by defining:
- what metrics you want
- where they come from
- what fields support aggregations

### Recommended reporting strategy (safe + scalable)
1. Treat `event_log` as the source of truth for state transitions.
2. Build admin views/queries that aggregate from `orders`, `donation_claims`, and/or `event_log`.
3. Optionally add materialized views later for performance.

### Suggested metrics
- Marketplace volume:
  - number of listings published
  - number of reservations created
  - number of pickup confirmations
  - number of donation assignments
- Fulfillment outcomes:
  - pickup success rate = pickup_confirmed / confirmed reservations
  - pickup failure rate
  - donation conversion = donated / donation_eligible
- Time-based metrics:
  - reservations per day/week
  - pickup confirmations per day/week
- Restaurant-specific metrics (admin only):
  - pickup confirmation rate per restaurant
  - donation fallback count per restaurant

### Suggested supporting fields
To keep metrics consistent, ensure these timestamps exist on state changes:
- `orders.created_at`
- `orders.payment_succeeded_at` (recommended)
- `orders.confirmed_at` (recommended)
- `orders.pickup_confirmed_at` / `orders.pickup_failed_at`
- `donation_claims.assigned_at`
- `donation_claims.donated_at`
- `donation_claims.completed_at`

### Security/public-safe notes
- Only admins can query aggregated reporting.
- Public users should never see internal exception details unless intended.

### Assumptions / questions
- Do you want exports (CSV) from admin dashboard in MVP?

