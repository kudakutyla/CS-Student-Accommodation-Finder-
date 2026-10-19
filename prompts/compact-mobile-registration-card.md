# Compact the mobile registration card

## Objective

Reduce vertical spacing on the registration page so the full form, including the
"Create account" button, fits within a typical 390 × 844 mobile viewport without
scrolling.

## Implementation

- Adjust mobile-only page/card padding, header spacing, form gaps, label spacing,
  and control heights in `frontend/app/register/page.tsx`.
- Keep inputs and buttons comfortably tappable, retain the side-by-side Student
  and Landlord buttons, and preserve readable labels.
- Restore the current roomier spacing at the existing `sm` breakpoint and above.
- Do not remove fields, validation, or functionality.

## Verification

- Run the frontend TypeScript check.
- At 390 × 844, verify the Create account button is fully visible without
  scrolling and the form does not overflow horizontally.
- Verify the desktop/tablet spacing remains comfortable.
