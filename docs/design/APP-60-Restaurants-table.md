## APP-60 Restaurants table

### Table: `restaurants`
Represents a restaurant account/tenant (owned by a user).

#### Suggested columns
- `id` (uuid, PK)
- `owner_user_id` (uuid, FK -> `app_users.id`)
- `name` (text)
- `description` (text, nullable)
- `closing_time` (time without time zone)
- `approval_status` (text/enum):
  - `pending_approval`
  - `approved`
  - `rejected`
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

Optional but typical:
- `contact_email` (text, nullable)
- `contact_phone` (text, nullable) (avoid if not needed)

#### RLS policy intent
- Restaurant owner can CRUD only their restaurant row.
- Customers can optionally read “public restaurant info”.
- Admin can read all.

#### Security/public-safe note
- Keep contact details limited; expose only what you intend customers to see publicly.

