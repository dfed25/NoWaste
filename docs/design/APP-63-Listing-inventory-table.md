## APP-63 Listing inventory table

### Why an inventory table
If a listing has multiple inventory lots, time-specific quantities, or you want robust allocation, an inventory table helps avoid race conditions.

### Table: `listing_inventory`
#### Suggested columns
- `id` (uuid, PK)
- `listing_id` (uuid, FK -> `listings.id`)
- `quantity_available` (integer)
- `quantity_reserved` (integer, default 0)
- `unit` (text, nullable; example: “meals”, “bags”)
- Optional scheduling partitioning:
  - `inventory_window_start` / `inventory_window_end` if quantities differ by window
- `created_at` / `updated_at`

#### Constraints / indexes
- Index on `(listing_id)`
- Ensure `quantity_reserved <= quantity_available` (enforced in app logic + optionally via DB constraints/triggers).

### Reservation allocation approach (recommended)
- When creating an `orders` reservation:
  - transactionally decrement available / increment reserved.
  - use `SELECT ... FOR UPDATE` or similar locking to prevent double-booking.

### RLS policy intent
- Restaurant: can update inventory rows for their listings.
- Customer: read inventory only indirectly through availability on `listings` (prefer hiding raw inventory).
- Admin: can read/update based on reporting needs.

