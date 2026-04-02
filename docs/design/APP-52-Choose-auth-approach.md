## APP-52 Choose auth approach

### Recommended choice
Use **Supabase Auth** with:
- Email/password or magic links (choose one)
- A `role` model stored server-side (and enforced via RLS)
- Guest checkout for consumers

### How roles should work (security-first)
- Use Supabase Auth to authenticate identity.
- Create an application-level authorization model:
  - Every user has a `app_users` profile row.
  - That row contains the “role” (customer/restaurant/admin).
- Enforce role checks via **RLS policies**, and also verify role in server-side route handlers.

### Suggested role boundaries
- `customer`: can browse public listings and manage their own reservations/pickup confirmations.
- `restaurant_staff`: can manage only their own listings and pickup confirmations for their listings.
- `donation_partner`: can manage only assigned donation claims.
- `admin`: can read aggregated reporting + resolve disputes/exception states.

### Guest checkout rule (locked)
- Guest checkout is allowed.
- Required fields: `name`, `email`, `phone`.
- Reservation is confirmed only after successful payment.

### Recommended session strategy
- Use Supabase client sessions in the frontend (for convenience).
- For trusted operations:
  - use server-side route handlers where the server reads the session token and runs queries with the right user context.

### Restaurant onboarding rule (locked)
- Restaurants self-register and are created in `pending_approval`.
- Only approved restaurants can publish listings.

