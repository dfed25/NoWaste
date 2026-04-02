## APP-75 Middleware / authorization plan

### Goals
- Ensure every privileged route and every mutation operation is authorized.
- Keep public-safe code paths small and avoid leaking sensitive data.

### Recommended approach (Next.js)
1. **Centralize auth extraction**: server-side middleware/utility reads the Supabase session.
2. **Derive role** from a trusted source (your `app_users` profile table), not from client UI state.
3. **Gate routes**:
  - protect admin pages
  - protect restaurant staff pages
  - allow customers to browse publicly
  - allow guest checkout path
4. **Enforce authorization again on mutations**:
  - never rely on client hiding controls
  - for every POST/PATCH/DELETE (and Stripe webhook handler), verify:
    - role is allowed
    - ownership constraints hold (restaurant_id/customer_user_id match acting user)

### Where to enforce
- Read-only operations:
  - rely primarily on RLS (and optionally endpoint-level checks)
- Write operations:
  - require endpoint/server checks + RLS
- Webhooks (Stripe):
  - verify signatures server-side and enforce state transitions idempotently

### Suggested middleware behavior
- Redirect or show “Access denied” for unauthorized users.
- Do not leak role existence:
  - error messages should be generic
- Rate-limit login/privileged endpoints if needed.
- Ensure guest checkout validates required fields (`name`, `email`, `phone`) before payment session creation.

### RLS alignment
- Middleware is UX gating.
- RLS is security enforcement.
- Authorization plan should assume middleware can be bypassed.

