## APP-43 Restaurant dashboard wireframe

### Layout (mobile-first)
```
[Top bar]
  - Brand/Logo (left)
  - Restaurant name (center/left)
  - User menu (right)

[Nav tabs]
  - Listings
  - Reservations
  - Donations
  - Settings

[Main content]
  [Summary cards]
    - Active listings: 3
    - Reservations today: 4
    - Pickup success: 92%
    - Donation fallback: 1

  [Primary action]
    [Create listing] (primary button)

  [Listings table/list]
    For each listing card/row:
      - Title
      - Pickup window (start - end)
      - Qty available
      - Status chip (Draft / Published / Reserved / PickupConfirmed / DonationEligible)
      - Actions: View, Edit, Manage pickup (as applicable)
```

### States
- Loading: skeleton cards + disabled actions
- Empty: “No listings yet” + `Create listing`
- Errors: safe retry

### Authorization boundaries (wireframe intent)
- Buttons and tables only show restaurant-owned listings/reservations.

