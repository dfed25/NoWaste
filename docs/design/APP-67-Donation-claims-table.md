## APP-67 Donation claims table

### What “donation claims” represent
When pickup fails, the system assigns/claims the surplus for donation and tracks that donation until completion.

### Table: `donation_claims`
#### Suggested columns
- `id` (uuid, PK)
- `listing_id` (uuid, FK -> `listings.id`)
- `donation_partner_id` (uuid, FK -> `donation_partners.id`)
- `claimed_at` (timestamptz, nullable)
- `picked_up_at` (timestamptz, nullable)
- `status` (enum/text):
  - `donation_eligible`
  - `donation_claimed`
  - `donated`
  - `donation_failed`
- `created_at` / `updated_at`

#### RLS policy intent
- Customer:
  - may read donation outcome for their related listing/order status only.
- Restaurant:
  - may read donation claim status only for their listings/orders.
- Admin:
  - can manage claims and partners.
- Donation partner:
  - can read/update only rows assigned to their `donation_partner_id`.

### Security/public-safe note
- Do not expose internal partner contact info unless it is intended for public/customer display.

