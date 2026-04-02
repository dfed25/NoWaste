## APP-46 Listing detail screen wireframe

### Layout (mobile-first)
```
[Top bar]
  - Back to results
  - Restaurant name (optional)

[Hero section]
  - Listing image (optional)
  - Title
  - Short description

[Pickup summary]
  - Pickup window start - end
  - Pickup location/address summary
  - Pickup instructions (short)

[Availability]
  - Qty available
  - Status chip (Published / Reserved / Unavailable)

[Reserve block]
  - Quantity selector (stepper)
  - (Optional) Pickup slot selector within window
  - Primary CTA:
    [Reserve & checkout]

[Details section]
  - Item list / included items
  - Allergen notes (optional)
  - Terms / FAQ link (optional)
```

### States
- Loading: skeleton for hero + pickup summary
- Unavailable: disable CTA, show reason
- Error: safe message + retry

