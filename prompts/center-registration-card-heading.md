# Center the registration card heading

## Objective

Center the "Create account" eyebrow and "Join Abode" heading inside the
registration card. Place the "Already have an account?" link beneath them,
right-aligned and underlined by default.

## Implementation

- Update only the registration card header in `frontend/app/register/page.tsx`.
- Center the eyebrow and heading together.
- Put the login link on its own row beneath the heading and align it to the
  right; show its underline by default.
- Preserve the current mobile card sizing and form layout so the submit button
  remains visible without scrolling at 390 × 844.
- Preserve the existing desktop layout and all navigation behavior.

## Verification

- Run the frontend TypeScript check.
- Verify the header alignment and underlined link on mobile and desktop.
- Confirm the Create account button remains visible at 390 × 844.
