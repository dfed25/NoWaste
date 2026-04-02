## APP-42 Create wireframes

### Scope
Create screen-level wireframes for:
- APP-43 Restaurant dashboard
- APP-44 Listing creation modal
- APP-45 Customer home screen
- APP-46 Listing detail screen
- APP-47 Checkout screen
- APP-48 Pickup confirmation screen
- APP-49 Admin dashboard

### Wireframe conventions (to keep them easy to implement)
- Mobile-first layout: stack elements vertically; make primary CTA prominent.
- Include explicit loading/empty/error states.
- Use clear action labels:
  - `Create listing`, `Reserve & checkout`, `Pay with Stripe`, `Confirm pickup`, `Generate report`, etc.
- Add “status chips” conceptually (Draft/Published/Reserved/PickupConfirmed/DonationEligible/Donated/etc).

### Security notes (public-safe)
- Do not include real secrets or tokens in UI screenshots/docs.
- Wireframes should reflect authorization boundaries:
  - restaurant can only act on their listings/reservations
  - customer only sees their own pickup confirmation context
  - admin sees aggregated/reporting data

### Next step (what I need from you)
If you already know any exact fields (example: item list vs free-text description, pickup address format, whether checkout is always paid/free), tell me and I will adjust the wireframes accordingly.

