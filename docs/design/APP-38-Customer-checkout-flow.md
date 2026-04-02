## APP-38 Customer checkout flow

### Primary goal
Reserve quantity within a pickup window for a paid consumer listing.

### Preconditions
- Customer is viewing `Listing detail`.
- Listing is `active`, `consumer` type, and has enough quantity.

### Main happy path (checkout)
1. Customer opens `Listing detail`.
2. Customer selects desired quantity and the restaurant-defined pickup window.
3. Customer clicks `Reserve & checkout`.
4. Guest checkout form requires:
   - name
   - email
   - phone number
5. Customer clicks `Pay with Stripe` -> redirected to Stripe checkout.
6. Reservation is confirmed only after successful payment verification.
7. Order transitions to `reserved`.

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
- Do not allow checkout for `donation` listings from customer routes.

