## APP-70 Define roles and permissions

### Role model (recommended)
Use a small set of roles enforced by:
- Supabase Auth for identity
- an application profile table (e.g. `app_users`) for role assignment
- RLS policies for every tenant-sensitive table
- server-side authorization checks in Next.js route handlers for privileged actions

### Recommended roles
- `customer`
- `restaurant_staff` (or `restaurant`)
- `donation_partner`
- `admin`

### Permission boundaries (public-safe intent)
- Never trust the client for authorization.
- Every operation that mutates data must be checked server-side:
  - role is valid
  - acting user owns the target resource (restaurant_id/customer_user_id, etc.)
  - admin-only actions are blocked for non-admins

### Typical permission matrix (high level)
- Customer:
  - read published listings
  - checkout as guest with required contact fields and payment
  - view own reservation/order status
- Restaurant staff:
  - manage their own listings/hours/inventory
  - confirm fulfillment outcome (`picked_up`, `missed_pickup`, `expired`, `donated`) for their own listings/orders
- Donation partner:
  - view donation-eligible items assigned to them
  - claim donation and update donation outcome (`picked_up`, `unable_to_pick_up`)
- Admin:
  - read aggregated reporting/metrics
  - manage role assignments, disable accounts, resolve exceptions
  - assign donation partners to donation-eligible orders

