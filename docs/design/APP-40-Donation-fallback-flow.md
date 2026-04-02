## APP-40 Donation fallback flow

### Primary goal
Provide a fallback path when surplus cannot be picked up/fulfilled as reserved (so the surplus still helps reduce waste).

### Trigger conditions (locked)
A listing becomes donation eligible only when all are true:
- listing is still available or partially unsold
- `donation_fallback_enabled = true`
- reservation cutoff has passed
- current time is within 30 minutes of restaurant closing
- listing has not already been claimed or completed

### Main happy path (donation fallback)
1. System flags a reservation/listing as `DonationEligible`.
2. Restaurant is notified (optional) and/or admin is notified.
3. Admin assigns a donation partner based on partner rules (MVP: admin-assigned mapping).
4. Donation partner sees assigned donation-eligible items.
5. Donation partner claims and updates pickup outcome.
6. System marks status:
   - `donation_eligible` -> `donation_claimed` -> `donated` (or `donation_failed`).

### UI states
- Eligible for donation notice (if shown to customers).
- “We could not complete pickup; donation has been arranged” confirmation messaging.

### Edge cases
- Partial fulfillment:
  - allocate quantities between pickup-confirmed vs donation.
- Duplicate triggers:
  - ensure idempotency so it only assigns donation once.
- Partner unavailable:
  - retry/choose another partner, keep status consistent.

### Security considerations (public-safe)
- Do not leak partner internal contact details beyond what is needed.
- Keep payment/refund logic separate from donation fallback (avoid incorrect refund assumptions).
- Ensure authorization: only admin can assign partners; restaurants can only resolve reservations for their own listings.

