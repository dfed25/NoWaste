## APP-56 Choose image upload/storage approach

### Recommended choice
Use **Supabase Storage** for listing images and restaurant assets.

### Suggested storage model
- Bucket(s):
  - `listing-images`
  - (optional) `restaurant-logos`
- Object naming:
  - prefix by restaurant + listing id (or hashed identifiers)
- Store:
  - public URL (if safe) OR
  - signed URLs (recommended for privacy)

### Security/public-safe notes
- Do not make all uploaded objects public if they might contain sensitive content.
- Use Storage RLS:
  - restaurant can upload/manage only their objects
  - customers can read only public listing images (or via signed URLs)
- Validate file types and sizes server-side:
  - restrict MIME types to images
  - restrict maximum size

### Assumptions / questions
- Are listing images intended to be fully public on the marketplace?
- Do you need moderation/approval before images appear publicly?

