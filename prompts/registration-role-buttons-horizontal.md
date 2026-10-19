# Place registration roles side by side

## Objective

Show the Student and Landlord role selection buttons next to each other in a
horizontal row on the registration page, including on mobile.

## Implementation

- Update only the role-selection grid in `frontend/app/register/page.tsx` to use
  two equal-width columns at all viewport sizes.
- Preserve the selected-role behavior, button accessibility, labels, and visual
  styling.
- Keep the controls within the registration card without horizontal overflow.

## Verification

- Run the frontend TypeScript check.
- Verify Student and Landlord render side by side at a 390px viewport and that
  both buttons remain usable.
