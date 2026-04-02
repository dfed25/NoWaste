## APP-35 Restaurant login flow

### Primary goal
Allow a restaurant user to authenticate and land on the restaurant dashboard.

### Preconditions
- Restaurant credentials are stored in your auth provider (ex: Supabase).
- Users can be tagged/authorized as `restaurant`.

### Main happy path
1. Restaurant opens the login screen (or “Sign in” CTA).
2. Restaurant enters credentials (email/password or magic link).
3. Auth success -> session is created.
4. App checks user role (`restaurant`).
5. App redirects to the restaurant dashboard.

### UI states
- Loading/auth-in-progress state after submit.
- Success redirect state (optional toast).
- Error state for invalid credentials.

### Edge cases / alternative paths
- User is authenticated but does not have `restaurant` role:
  - Show “Access denied” and provide a safe next action (sign out / contact admin).
- Email link expired / resend required:
  - Provide “Resend email” with cooldown.
- Rate limiting / repeated failures:
  - Show generic error messages (avoid leaking which emails exist).
- Session expired:
  - Prompt re-auth and preserve intended destination if possible.

### Security considerations (public-safe)
- Role checks must be enforced server-side (never trust client role flags).
- Use least-privilege permissions for restaurant operations (only affect their own listings/reservations).
- Never expose auth errors that reveal user existence beyond generic messaging.
- Apply request throttling for login/resend endpoints.

