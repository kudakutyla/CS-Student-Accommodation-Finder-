# Permanently underline the login page's Back home link

## Objective

Show a visible text underline beneath the "Back home" link on the login page at all
screen sizes.

## Implementation

- Update the existing `Back home` link in `frontend/app/login/page.tsx` to use the
  established Tailwind underline styling by default, retaining its current color,
  placement, destination, and hover behavior.
- Do not change other links or login-page layout.

## Verification

- Run the frontend TypeScript check.
- Confirm the login page renders and the "Back home" link is underlined before hover.
