## APP-66 Donation partners table

### Table: `donation_partners`
Represents organizations/partners who receive donations when pickup fails.

#### Suggested columns
- `id` (uuid, PK)
- `name` (text)
- `contact_email` (text, nullable)
- `contact_phone` (text, nullable)
- `website_url` (text, nullable)
- `address_text` (text, nullable)
- `address_lat` / `address_lng` (numeric, nullable)
- `is_active` (boolean, default true)
- `approval_status` (text/enum):
  - `pending_approval`
  - `approved`
  - `rejected`
- `service_area` (text, nullable)
- `created_at` / `updated_at`

### RLS policy intent
- Admin can create/update/activate/deactivate.
- Restaurant/customer reads are typically read-only limited:
  - either show partner names only when needed
  - or hide partners until admin assigns

### Security/public-safe note
- Avoid collecting sensitive personal data about partner contacts unless required.

