## APP-72 Restaurant staff role rules

### What restaurant staff can do
- Create listings (as `draft` or publish to `published`).
- Edit listing details they own.
- Manage pickup windows/hours for their restaurant.
- Manage listing inventory/availability for their listings.
- View reservations/orders that belong to their listings.
- Confirm pickup:
  - `picked_up`
  - `missed_pickup`
  - `expired`
  - `donated`
- Manage donation fallback outcomes for their listings (if your policy requires restaurant action).

### What restaurant staff should never do
- Access other restaurants’ listings/reservations/inventory/pickup windows.
- Confirm or resolve pickups for orders that are not tied to their restaurant.
- Access admin reporting beyond their scope.

### RLS intent (public-safe)
- `restaurants`: write allowed only where `owner_user_id` matches the acting user.
- `listings`, `restaurant_hours`, `listing_inventory`, `pickup_windows`: write allowed only for rows where `restaurant_id` maps to the acting user’s restaurant.
- `orders`: read allowed only for orders linked to their listings.
- pickup confirmation updates allowed only for orders linked to their restaurant.

