## APP-47 Checkout screen wireframe

### Layout (mobile-first)
```
[Header]
  - Checkout
  - Reservation summary (small)

[Stepper]
  1) Review
  2) Payment
  3) Confirmation

[Review section]
  - Listing title
  - Quantity reserved
  - Pickup window
  - Pickup address summary
  - Instructions summary

[Totals section]
  - Price breakdown (if applicable)
  - Total

[Payment section]
  - Primary button:
    [Pay with Stripe]
  - If free: [Confirm reservation]

[Footer]
  - Security/terms link (optional)
  - Support link (optional)
```

### States
- Loading: disable controls while creating checkout session.
- Error: show “Could not start payment/reservation” + retry.
- Cancelled: show “Payment cancelled” and allow re-checkout.

### Security notes (wireframe intent)
- Payment success should be confirmed server-side before marking reservation confirmed.
- Show only non-sensitive payment status to the user.

