## APP-34 Design user flows

### Goals
- Provide a complete end-to-end understanding of how a restaurant, customer, and admin interact with the surplus marketplace.
- Capture happy paths, edge cases, and key states needed for UI + backend implementation.

### Roles
- `Restaurant`: authenticated user who creates surplus listings and fulfills pickups.
- `Customer`: authenticated (or guest-to-checkout) user who browses listings, checks out/reserves a pickup, and confirms pickup.
- `Admin`: authenticated user with reporting/override capabilities.

### High-level journey (end-to-end)
1. Restaurant login
2. Restaurant creates a surplus listing (publishes listing)
3. Customer browses and opens listing detail
4. Customer selects quantity/pickup slot (and completes checkout/reservation)
5. Pickup confirmation occurs (customer confirms; restaurant can confirm/resolve)
6. Donation fallback occurs if pickup cannot be completed
7. Admin reviews reporting/health of the marketplace

### Core entities and suggested states (implementation-agnostic)
Listings (surplus)
- `Draft` -> (published) -> `Published`
- `Published` -> (reserved by customer) -> `Reserved`
- `Reserved` -> (pickup confirmed) -> `PickupConfirmed`
- `PickupConfirmed` -> (fulfilled/completed) -> `Completed`
- `Reserved` -> (pickup missed/canceled/fallback trigger) -> `DonationEligible` -> `Donated` -> `Completed`
- `Published` -> (canceled/expired) -> `Expired`

Reservations
- `Created` -> `PaymentPending` (if payment required) -> `Confirmed` (after successful payment/session)
- `Confirmed` -> `PickupConfirmed`
- `Confirmed` -> `PickupFailed` (missed or resolved as fallback)

### Happy paths summary (mapped to subsequent issues)
- `APP-35`: Restaurant login flow
- `APP-36`: Create surplus listing flow
- `APP-37`: Customer browse flow
- `APP-38`: Customer checkout flow
- `APP-39`: Pickup confirmation flow
- `APP-40`: Donation fallback flow
- `APP-41`: Admin reporting flow

### Edge cases to account for across flows
- Listing availability changes while customer is browsing/checkout (quantity, cutoff time).
- Payment canceled/failed (customer should not get a reserved pickup).
- Pickup confirmation disputes (wrong reservation, already fulfilled, partial quantities).
- Donation fallback timing (cutoff after pickup window ends).
- Authorization boundaries (customers can only view their own reservations; restaurants only see their listings; admins only see report data).

### Security (public-safe checklist)
- Do not log or expose secrets in UI or docs (API keys, service role keys, Stripe webhook secrets).
- Ensure all “role” decisions are enforced server-side (never trust the client for admin/restaurant permissions).
- Sanitize user-provided text displayed in listings to prevent XSS.
- Use signed/short-lived reservation confirmation links or codes; rate-limit confirmation attempts.
- If Stripe is used: verify payment success via server-side verification/webhooks, not only client redirect.

### Assumptions (tell me what to change)
- Pickup fulfillment is tied to a pickup window (`start/end`) and can be confirmed by customer and/or restaurant.
- Donation fallback triggers automatically when a reservation is not confirmed by a cutoff (exact cutoff TBD).
- Payment is optional or required depending on your model (exact rules TBD).

