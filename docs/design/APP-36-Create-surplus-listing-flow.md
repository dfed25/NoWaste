## APP-36 Create surplus listing flow

### Primary goal
Let a restaurant publish a surplus listing that customers can browse and reserve for pickup.

### Preconditions
- Restaurant is authenticated and authorized.
- Restaurant has at least one valid pickup location/address (or enters it per listing).

### Main happy path (happy UI/logic)
1. Restaurant opens `Restaurant Dashboard`.
2. Clicks `Create listing` -> opens `Listing creation modal`.
3. Restaurant fills required listing fields (see “Suggested fields”).
4. Client validates inputs (format, required fields, date/time in the future).
5. Restaurant submits -> listing is created as `Draft` and then `Published` (or directly `Published`).
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
- Optional: price model (free vs paid/reservation)

### UI states
- Modal open/close.
- Inline field validation errors.
- Loading state on submit.
- Success state (toast + modal closes).

### Edge cases
- Pickup window overlaps with an existing listing constraint (if any).
- Time window is invalid (start after end, end in the past).
- Quantity is invalid (zero/negative).
- Restaurant attempts to publish while “account disabled” (should be blocked).
- Network failure during submit:
  - UI should allow retry without creating duplicates (idempotency server-side).

### Security considerations (public-safe)
- Only the authenticated restaurant may create listings under their identity.
- Server must enforce:
  - restaurant ownership checks
  - validation of pickup window (no past times, reasonable ranges)
  - escaping/sanitizing of free-text fields to prevent XSS in listing pages.

### Open questions (what I need from you to finalize)
- Are listings always free, or can they be priced/reservable via Stripe?
- Should customers select a specific pickup time slot, or just pick up within the window?

