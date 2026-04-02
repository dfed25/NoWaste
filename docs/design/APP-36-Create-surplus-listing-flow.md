## APP-36 Create surplus listing flow

### Primary goal
Let a restaurant publish a surplus listing that customers can browse and reserve for pickup.

### Preconditions
- Restaurant is authenticated and authorized.
- Restaurant `approval_status = approved`.
- Restaurant has at least one valid pickup location/address (or enters it per listing).

### Main happy path (happy UI/logic)
1. Restaurant opens `Restaurant Dashboard`.
2. Clicks `Create listing` -> opens `Listing creation modal`.
3. Restaurant fills required listing fields (see “Suggested fields”).
4. Client validates inputs (format, required fields, date/time in the future).
5. Restaurant submits -> listing is created as `draft`.
6. Restaurant publishes listing -> `active`.
6. UI shows success + listing is visible in the dashboard listings list.

### Suggested fields (implementation-agnostic)
- Listing title (short)
- Description (what is included)
- Items/quantity (text or line items)
- Quantity available (number + unit)
- Pickup window (`start` and `end`)
- Pickup instructions (free text)
- Optional: image(s)
- Optional: allergen notes
- `listing_type` (`consumer` or `donation`)
- `price_cents`
- `reservation_cutoff_at`
- `donation_fallback_enabled` (boolean)

### UI states
- Modal open/close.
- Inline field validation errors.
- Loading state on submit.
- Success state (toast + modal closes).

### Edge cases
- Pickup window overlaps with an existing listing constraint (if any).
- Time window is invalid (start after end, end in the past).
- Quantity is invalid (zero/negative).
- Restaurant attempts to publish while `pending_approval` (must be blocked).
- Network failure during submit:
  - UI should allow retry without creating duplicates (idempotency server-side).

### Security considerations (public-safe)
- Only the authenticated restaurant may create listings under their identity.
- Server must enforce:
  - restaurant ownership checks
  - validation of pickup window (no past times, reasonable ranges)
  - escaping/sanitizing of free-text fields to prevent XSS in listing pages.
  - `consumer` listings require valid paid price.
  - `donation` listings are free and not customer-purchasable.

