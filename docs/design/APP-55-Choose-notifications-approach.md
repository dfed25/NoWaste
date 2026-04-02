## APP-55 Choose notifications approach

### Recommended choice
Start with **email notifications** plus optional in-app status updates.

### Notification sources (what should trigger messages)
- Reservation confirmed:
  - customer: confirmation email
  - restaurant: pickup scheduled/ready notification
- Pickup confirmation / pickup failed:
  - customer: pickup success or next steps
  - restaurant/admin: exception state
- Donation fallback eligibility:
  - customer: donation fallback message (policy-dependent)
  - admin: donation assignment needed/queued

### Delivery method
- Use an email provider (examples: Resend/SendGrid/Postmark) called from:
  - server route handlers (simple events), and/or
  - background jobs/edge functions (for reliability).

### Security/public-safe notes
- Do not include payment secrets or internal tokens in notifications.
- Notifications should reference public-safe reservation identifiers (not raw DB IDs unless they’re not guessable).
- Avoid logging PII in error traces.

### Assumptions / questions
- Do you need SMS/push notifications for pickups, or is email enough for MVP?

