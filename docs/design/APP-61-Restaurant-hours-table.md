## APP-61 Restaurant hours table

### Table: `restaurant_hours`
Stores business hours for delivery/pickup availability.

#### Suggested columns
- `id` (uuid, PK)
- `restaurant_id` (uuid, FK -> `restaurants.id`)
- `day_of_week` (smallint): 0-6 (or 1-7)
- `opens_at` (time without time zone)
- `closes_at` (time without time zone)
- `timezone` (text, optional)
- `is_closed` (boolean, default false)
- `created_at` / `updated_at`

#### Constraints / indexes
- Unique: `(restaurant_id, day_of_week, opens_at, closes_at)` or simplified uniqueness `(restaurant_id, day_of_week)` depending on your rule.
- Index on `restaurant_id`.

#### RLS policy intent
- Restaurant owner can manage their rows only.
- Customers/admin can read based on “public visibility” (if shown).

