## APP-62 Listings table

### Table: `listings`
Stores surplus listing metadata (the item being offered for pickup).

#### Suggested columns
- `id` (uuid, PK)
- `restaurant_id` (uuid, FK -> `restaurants.id`)
- `title` (text)
- `description` (text)
- `listing_type` (text/enum):
  - `consumer`
  - `donation`
- `status` (text/enum):
  - `draft`
  - `active`
  - `reserved` (optional if you model via orders)
  - `expired`
  - `deleted` (optional soft delete)
- `quantity_total` (integer)
- `quantity_remaining` (integer)
- `price_cents` (integer)
- `pickup_window_start` / `pickup_window_end` (timestamptz)
- `reservation_cutoff_at` (timestamptz)
- `donation_fallback_enabled` (boolean)
- `pickup_location_text` (text, nullable)
- `pickup_lat` / `pickup_lng` (numeric, nullable; for distance)
- `pickup_instructions` (text, nullable)
- `created_by_user_id` (uuid, FK -> `app_users.id`, nullable if derived)
- `created_at` / `updated_at`

Optional:
- `image_url` (if you don’t use a separate table) or rely on `listing_images` via Storage.

#### RLS policy intent
- Restaurant owner can CRUD only their own listings.
- Customers can read only `active` listings where `listing_type = consumer`.
- Donation partners can read donation listings only when assigned by admin rules.
- Admin can read all.

#### Security/public-safe note
- Listing text should be sanitized on output to prevent XSS.
- Don’t store private contact data inside listings that customers can see.

