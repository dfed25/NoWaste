## APP-49 Admin dashboard wireframe

### Layout (mobile-first)
```
[Top bar]
  - Admin label
  - User menu

[Filters]
  - Date range
  - Reservation status
  - Listing status
  - Donation status

[Metrics cards row]
  - Total reservations (range)
  - Pickup confirmation rate
  - Donation eligible count
  - Donated/completed count

[Tables / lists]
  - Recent exceptions (pickups failed, disputes)
  - Donation queue (eligible items)
  - Restaurants needing attention (optional)

[Actions]
  - View details
  - Resolve/assign partner (when applicable)
  - Export report (admin only)
```

### States
- Loading skeletons.
- Empty state for filters.
- Error state for fetch/export.

### Security intent
- Admin-only access enforced server-side.
- Aggregation should exclude sensitive customer info unless explicitly needed.

