## APP-38 Customer checkout flow

### Primary goal
Reserve a pickup slot/quantity for a specific listing (and complete payment if applicable).

### Preconditions
- Customer is viewing `Listing detail`.
- Listing is `Published` and has enough available quantity (or capacity).

### Main happy path (checkout)
1. Customer opens `Listing detail`.
2. Customer selects desired quantity (and optionally pickup time slot within the window).
3. Customer clicks `Reserve & checkout`.
4. UI shows `Checkout screen` (review pickup info + total).
5. If payment is enabled:
   - Customer clicks `Pay with Stripe` -> redirected to Stripe checkout.
   - After completion, app receives success redirect or server verifies via webhook.
6. Reservation is confirmed/created as `Confirmed`.
7. Customer sees a `Confirmation` state/screen and can access pickup confirmation flow.

### UI states
- Disabled reserve button when quantity invalid.
- Loading while creating checkout session/reservation.
- Success confirmation with reservation identifier.

### Edge cases
- Payment canceled:
  - Do not confirm reservation; show safe “Payment canceled” message.
- Listing availability changed after click:
  - Re-check availability; if insufficient, show alternative options or “Unavailable”.
- Network timeouts during reservation/checkout-session creation:
  - Client should offer retry; server should treat duplicate creation as idempotent.

### Security considerations (public-safe)
- Always verify Stripe payment success server-side before marking reservation `Confirmed`.
- Prevent double-booking with server-side transactional checks (quantity/capacity).
- Never expose reservation internals publicly beyond what’s required for pickup confirmation.

