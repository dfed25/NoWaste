## APP-64 Orders table

### What “orders” represent in this app
The “order” record is the customer reservation that may include:
- payment session/reference (if paid)
- fulfillment/pickup confirmation state

### Table: `orders`
#### Suggested columns
- `id` (uuid, PK)
- `listing_id` (uuid, FK -> `listings.id`)
- `customer_user_id` (uuid, FK -> `app_users.id`, nullable for guest checkout)
- `customer_name` (text)
- `customer_email` (text)
- `customer_phone` (text)
- `restaurant_id` (uuid, FK -> `restaurants.id`) (denormalize for easier RLS)
- `quantity` (integer)
- `pickup_window_id` (uuid, FK -> `pickup_windows.id`, nullable if fixed by listing)
- `payment_status` (enum/text):
  - `pending`
  - `paid`
  - `failed`
  - `refunded`
- `fulfillment_status` (enum/text):
  - `reserved`
  - `picked_up`
  - `missed_pickup`
  - `expired`
  - `donated`
- `stripe_checkout_session_id` (text, nullable)
- `stripe_payment_intent_id` (text, nullable)
- `stripe_customer_id` (text, nullable; optional)
- `reservation_code` (text, unique, non-guessable; for pickup confirmation)
- `created_at` / `updated_at`

#### Constraints / indexes
- Index `(customer_user_id, created_at desc)`
- Index `(restaurant_id, status)`
- Unique on `reservation_code`.

### State transition rules (recommended)
- Reservation is confirmed only after successful payment verification.
- Restaurant staff is authoritative for fulfillment transitions.
- Customers can view status but cannot finalize fulfillment outcome.

### Security/public-safe note
- RLS should ensure:
  - customer reads their own orders only
  - restaurant reads orders tied to their restaurant only
  - admin reads all orders

