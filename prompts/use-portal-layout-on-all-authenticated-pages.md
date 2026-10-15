# Use the portal layout on all authenticated pages

## Problem

`AppShell` currently selects the role-aware portal layout only for student,
landlord, admin, listings, messages, and notifications routes. Other routes such
as the home page and account pages fall back to the public `Navbar`, which puts
authenticated navigation actions in the top header instead of the role sidebar
and mobile hamburger drawer.

## Implementation

1. For any authenticated user with a known role, render the existing role-aware
   `AppShell` layout on every app route. Keep route-specific role selection for
   `/student`, `/landlord`, and `/admin`; for routes outside those areas, use the
   authenticated user's role.
2. Preserve the public `Navbar` for signed-out users. Do not show both public
   header links and portal navigation to signed-in users.
3. Keep the current responsive behavior: persistent role navigation on
   medium/desktop layouts and all portal navigation, user identity, and sign-out
   actions within the mobile hamburger drawer on small screens.
4. Keep role-specific links and backend/frontend authorization behavior
   unchanged; do not expose admin links to other roles.
5. Do not change page bodies or introduce unrelated navigation redesigns.

## Verification

Run frontend TypeScript, lint, and production build. If browser validation is
available, inspect authenticated home, listing, profile, messages, and
notifications pages at mobile and desktop widths; verify the public navbar still
appears when signed out.

## Acceptance criteria

- Every route rendered for an authenticated user uses that user's portal shell.
- Authenticated mobile pages keep portal navigation and sign-out in the hamburger
  drawer rather than a crowded header or footer.
- Signed-out pages continue to use the public navigation.
