## APP-34 Design user flows

### Final MVP policy (locked)
- Guest checkout is allowed.
- Guest checkout requires `name`, `email`, `phone`, and successful payment before reservation confirmation.
- Restaurants self-register and start in `pending_approval`.
- Only `approved` restaurants can publish listings.
- Customers reserve within a pickup window (no minute-by-minute slot selection).
- Restaurant staff is the source of truth for fulfillment outcomes.
- Consumer listings are paid.
- Donation listings are free and visible only to approved donation partners.
- Donation partner assignment is admin-assigned for MVP.

### Core state flow
Consumer sale:
- `draft` -> `active` -> `reserved` -> `picked_up`
- side paths: `active` -> `expired`, `reserved` -> `missed_pickup`, `active` -> `donation_eligible`

Donation flow:
- `donation_eligible` -> `donation_claimed` -> `donated`
- side path: `donation_claimed` -> `donation_failed`

### Donation eligibility rule
A listing becomes donation eligible when all are true:
- listing still available or partially unsold
- `donation_fallback_enabled = true`
- reservation cutoff has passed
- current time is within 30 minutes of restaurant closing
- listing has not already been claimed or completed

### Security baseline
- Enforce role and ownership checks server-side and with RLS.
- Confirm payments server-side before reservation becomes confirmed.
- Never expose secrets, webhook signatures, or internal tokens in client/UI.

