## APP-71 Customer role rules

### What customers can do (happy paths)
- Browse and read only `active` consumer listings.
- Reserve a pickup for a listing (subject to quantity and pickup window rules).
- Complete guest checkout with required `name`, `email`, `phone`.
- Complete payment before reservation confirmation.
- View their own reservations/orders (only those they created).
- View fulfillment status updates.
- See donation fallback messaging when pickup cannot be completed (policy-driven).

### What customers should never do
- Create or edit restaurant listings that they do not own.
- View other customers’ reservations/orders.
- Confirm pickup/final fulfillment outcomes.
- Access admin reporting pages or resolve marketplace exceptions.
- Trigger donation assignment directly (unless a specific customer action exists in your policy).

### Data access rules (RLS intent)
- Customers can `SELECT` their own orders/reservations using `customer_user_id`.
- Customers can `UPDATE` only allowed fields in their own orders:
  - contact details updates (if policy allows)
  - view status transitions
### UI authorization checks (public-safe)
- Hide or disable actions in the UI when the user’s role is not allowed.
- Still enforce everything server-side (RLS + server route checks), since UI hiding alone is not secure.

