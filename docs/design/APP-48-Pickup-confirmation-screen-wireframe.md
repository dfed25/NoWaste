## APP-48 Pickup confirmation screen wireframe

### Layout (mobile-first)
```
[Header]
  - Confirm pickup

[Reservation details]
  - Listing title
  - Restaurant name
  - Pickup window
  - Pickup instructions (expanded/collapsible)

[Confirmation section]
  - Status text:
    - Waiting for confirmation / Confirmed / Pickup failed
  - Primary CTA (when eligible):
    [Confirm pickup]

[Optional assistance]
  - "Need help?" link
  - Contact restaurant (if policy allows)
```

### States
- Waiting: show details + confirm CTA.
- Confirmed: success messaging + next steps (optional).
- Exception: show that donation fallback may occur and provide contact/support.

### Authorization boundaries
- Customer can only confirm their own reservation.

