## APP-37 Customer browse flow

### Primary goal
Enable customers to discover available surplus listings and open listing details.

### Preconditions
- Listings that are `Published` are visible to customers.
- Customer has a search/filter surface from the home screen.

### Main happy path
1. Customer lands on `Customer home`.
2. Customer uses search and filters (optional).
3. Customer sees a grid/list of available listings.
4. Customer taps/clicks a listing card.
5. Customer reaches `Listing detail`.

### Suggested browsing UI elements
- Search (by title/restaurant/item keywords)
- Filters:
  - pickup date/window (today/this week/custom)
  - availability status
  - distance/location (if applicable)
  - category/cuisine (optional)

### UI states
- Loading skeleton while fetching listings.
- Empty state (“No listings available” + optional CTA to retry).
- Error state with safe messaging.

### Edge cases
- Listing becomes unavailable between card display and click:
  - When loading detail, refresh availability and show an “Unavailable” state.
- Network/offline:
  - Provide a retry.
- Long lists:
  - Pagination or “Load more”.

### Security considerations (public-safe)
- Only show public listings (filter by `Published` server-side).
- Escape/sanitize listing text to prevent injection/XSS.
- Avoid leaking internal status codes; map to user-friendly labels.

