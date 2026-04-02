## APP-65 Pickup windows table

### Table: `pickup_windows`
Pickup scheduling for a listing.

#### Suggested columns
- `id` (uuid, PK)
- `listing_id` (uuid, FK -> `listings.id`)
- `start_at` (timestamptz)
- `end_at` (timestamptz)
- `timezone` (text, nullable)
- `location_text` (text, nullable)
- `location_lat` / `location_lng` (numeric, nullable)
- `pickup_instructions` (text, nullable)
- `created_at` / `updated_at`

#### Constraints / indexes
- CHECK `end_at > start_at`
- Index on `listing_id`
- Index on `start_at` / `end_at` for time-range queries

### MVP rule
- Customers select a restaurant-defined pickup window.
- Customers do not select minute-by-minute appointment slots.

### RLS policy intent
- Restaurant can CRUD windows for their listing.
- Customers can read windows only for `published` listings (and/or only the listings they can access).
- Admin can read all.

