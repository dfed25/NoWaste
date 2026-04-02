## APP-73 Donation partner role rules

### What donation partners can do
- View donation-eligible items assigned to them.
- Claim a donation.
- Mark donation as picked up.
- Mark donation as unable to pick up.

### What donation partners should never do
- Access or modify orders/reservations belonging to other parties.
- Assign themselves to donation claims they don’t own.
- Access admin reporting pages.
- Read sensitive customer PII not needed for donation fulfillment (keep scope minimal).
- Edit listing price.
- Edit listing quantity.
- Edit restaurant details.
- Confirm customer pickups.
- Modify completed sale records.

### RLS intent (public-safe)
- Donation partner can `SELECT` donation claims where `donation_partner_id` equals their assigned partner identity.
- Donation partner can `UPDATE` only donation-status fields (and only to allowed next states).

### Integration assumption
- Donation partners operate through a protected dashboard; all updates must be server-side validated.

