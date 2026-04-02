## APP-74 Admin role rules

### What admins can do (core)
- Read and filter reporting/metrics and operational exceptions.
- Assign donation partners to donation-eligible orders/claims.
- Configure admin-assigned partner rules (example: Restaurant A -> Partner X).
- Resolve exceptions and disputes (pickup failure vs partial fulfillment).
- Approve or reject self-registered restaurants.
- Manage role assignment if you store roles in your app profile table.

### What admins should never do (security intent)
- Never rely on client-provided data for role or permission checks.
- Never expose secrets or webhook signatures in admin UI.
- Avoid leaking customer-specific sensitive data unless intended.

### RLS intent (public-safe)
- Admin role should be enforced by:
  - server-side role check for privileged endpoints, and
  - RLS policies that allow admin to `SELECT` aggregated reporting data and operational tables.

### Recommended admin UX boundaries
- Admin should see “why” an order is flagged, but with carefully curated fields.
- Use audit trails via `event_log` for state transitions and admin actions.

