## APP-39 Pickup confirmation flow

### Primary goal
Confirm fulfillment outcome with restaurant staff as the authoritative confirmer.

### Preconditions
- A reservation exists and has a pickup window.
- Restaurant staff can access the reservation tied to their restaurant.

### Main happy path
1. Pickup window begins/arrives.
2. Restaurant staff reviews reservation status.
3. Restaurant staff marks one fulfillment outcome:
   - `picked_up`
   - `missed_pickup`
   - `expired`
   - `donated`
4. Customers can view status updates but cannot finalize fulfillment state.

### UI states
- “Waiting for confirmation” state.
- “Confirmed” state.
- “Exception / needs attention” state (optional).

### Edge cases
- No-show or partial unsold quantity:
  - restaurant marks `missed_pickup`; fallback logic can trigger donation eligibility.
- Expired window with no handoff:
  - restaurant marks `expired`.

### Security considerations (public-safe)
- Use short-lived confirmation codes or signed URLs (avoid predictable codes).
- Enforce that restaurant can only confirm reservations tied to their listings.
- Log confirmation attempts server-side (audit trail) without sensitive PII in logs.

