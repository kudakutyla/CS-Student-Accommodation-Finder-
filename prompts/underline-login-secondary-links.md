# Permanently underline secondary login links

## Objective

Show visible text underlines beneath "Forgot password?" and "Create one" on the
login page at all screen sizes.

## Implementation

- Update only the existing links in `frontend/app/login/page.tsx` to use the
  established Tailwind underline styling by default.
- Retain each link's current color, placement, destination, and hover behavior.
- Do not change other links or the login-page layout.

## Verification

- Run the frontend TypeScript check.
- Verify both links appear underlined on the login page without hovering.
