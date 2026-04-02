## APP-44 Listing creation modal wireframe

### Modal layout (mobile-first)
```
--------------------------------------------
| Create surplus listing                  |
| [X] Close                                |
--------------------------------------------

[Section: Basic info]
  - Listing title (text)
  - Description (textarea)

[Section: Items / quantity]
  - Item(s) (text or list control)
  - Quantity available (number + unit)

[Section: Pickup availability]
  - Pickup window start (date/time)
  - Pickup window end (date/time)

[Section: Pickup instructions]
  - Pickup instructions (textarea)

[Optional: Media & notes]
  - Add images (upload)
  - Allergen notes (textarea)

--------------------------------------------
| Actions                                  |
|  [Cancel] [Create listing] (primary)   |
--------------------------------------------
```

### Inline validation / states
- Required fields missing: show field-level errors.
- Invalid pickup window: show “Pick a future time range”.
- Submit loading state: disable CTA and show spinner.

### Authorization boundaries
- Modal is available only to authenticated restaurant users.

