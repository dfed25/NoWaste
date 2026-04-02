## APP-59 Users table

### Table: `app_users`
Represents an authenticated user profile plus role information.

#### Suggested columns
- `id` (uuid, PK): references `auth.users(id)`
- `email` (text): optionally denormalized from auth (or left out if you can query auth)
- `display_name` (text)
- `role` (text or enum):
  - `customer`
  - `restaurant_staff`
  - `donation_partner`
  - `admin`
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### Constraints / indexes
- Unique constraint on `id` (PK)
- Index on `role` if you need admin listing of users.

#### RLS policy intent
- Users can read/write only their own row.
- Admin can read others (server-side admin route only).

#### Public-safe security note
- Never derive “admin” from client claims alone; enforce via RLS + server checks.

