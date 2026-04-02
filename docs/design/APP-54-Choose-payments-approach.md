## APP-54 Choose payments approach

### Recommended choice
Use **Stripe** for consumer listing payments, with server-verified webhook handling.

### Recommended patterns
- Create Checkout Session / PaymentIntent on the server.
- Store a `stripe_payment` reference in your `orders`/`reservations` rows.
- Mark payment success only after receiving a **Stripe webhook** event.
- Keep customer UI responsive:
  - show “Payment pending” after redirect
  - show final state after webhook updates the reservation/order.

### MVP model (locked)
- Consumer listings are paid.
- Donation listings are free and only available to donation partners.
- Reservation is confirmed only after successful payment.

### Webhook events (typical)
- `checkout.session.completed` (or `payment_intent.succeeded`)
- `checkout.session.async_payment_failed` (or `payment_intent.payment_failed`)

### Security/public-safe notes
- Never store webhook secrets in the repository.
- Validate webhook signatures server-side.
- Ensure idempotency for webhook handlers (webhooks can retry).

### Operational rule
- Payment applies to reservation/order creation for consumer listings.

