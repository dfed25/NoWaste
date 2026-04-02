## APP-53 Choose maps/location approach

### Recommended approach
Use **geocoding + distance calculations** first (minimal maps), then add maps UI later.

### What “minimal maps” means
- Store address and/or coordinates for pickup locations.
- Compute “distance” server-side when needed (or precompute/approximate).
- Use a lightweight maps UI only if your product needs it (optional).

### Suggested implementation choices
- Geocoding provider:
  - Start with a provider that does not require expensive usage (or use manual entry).
  - Store `latitude/longitude` alongside the textual address.
- Distance:
  - Compute using PostGIS (if enabled) or a server-side library.
  - Keep results approximate; do not overpromise “exact distance”.

### Security/public-safe notes
- Do not expose geocoding API keys in the client.
- Store only the data needed for marketplace function (avoid over-collecting precise personal locations).

### Assumptions / questions
- Is pickup location publicly visible (for customers to coordinate), or just shown after checkout?
- Do you want distance filtering in the first MVP or later?

