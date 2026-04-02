## APP-41 Admin reporting flow

### Primary goal
Give admins visibility into marketplace health and operational exceptions.

### Preconditions
- Admin is authenticated and has `admin` role.
- Reporting data is aggregated from listing/reservation/pickup/donation events.

### Main happy path
1. Admin opens `Admin dashboard`.
2. Admin sets filters (date range, listing status, reservation status, location, etc.).
3. Dashboard loads:
   - Overview metrics (cards)
   - Tables of recent reservations and exceptions
   - Donation stats (counts + completion)
4. Admin can open details for a flagged reservation/listing.
5. Admin may:
   - assign a donation partner (if needed)
   - resolve disputes / mark exceptions (policy TBD)

### UI states
- Loading skeleton for charts/tables.
- Empty state (no data for filters).
- Error state (retry with safe messaging).

### Edge cases
- Late events arrive (webhooks/async updates):
  - Dashboard should update without confusing the admin (idempotent updates).
- Large datasets:
  - pagination + server-side filtering.

### Security considerations (public-safe)
- Enforce admin permissions server-side for every reporting query.
- Prevent data leakage:
  - do not show customer sensitive info unless explicitly intended.
- Protect exports (CSV/PDF):
  - ensure only admins can download and that files are generated securely.

