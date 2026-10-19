# Strengthen selected registration role styling

## Objective

Make the selected Student or Landlord role button more visibly colored on the
registration page.

## Implementation

- Update only the selected-state styles for the role buttons in
  `frontend/app/register/page.tsx`.
- Use a stronger existing green accent with a contrasting readable label, while
  retaining an obvious border and the current unselected styling.
- Preserve role selection behavior, button dimensions, layout, and form spacing.

## Verification

- Run the frontend TypeScript check.
- Verify the selected role has a clearly stronger color than the unselected role
  on mobile.
- Select Landlord and confirm the stronger styling moves to the newly selected
  button.
