# Standardize Find Homes navigation and layout

## Problem

The Find Homes page should use the same authenticated portal layout as the other
pages, with consistent header treatment and role-aware navigation in the
hamburger sidebar on narrow screens. The existing shared `AppShell` contains
recent uncommitted changes for discovery routes and responsive navigation; build
on those changes rather than reverting or replacing them.

## Implementation

1. Inspect the current `AppShell`, `Navbar`, and Find Homes page implementation
   and preserve the existing public navigation for signed-out visitors.
2. Ensure authenticated users on `/listings` and listing detail routes render the
   same role-aware portal shell as other authenticated pages, with no duplicate
   public header links.
3. Keep the responsive sidebar behavior consistent: portal links, identity, and
   sign-out remain available in the mobile hamburger drawer; the persistent
   sidebar appears at the existing tablet/desktop breakpoint.
4. Make only the header or layout changes needed for Find Homes to match the
   rest of the application. Preserve listing search, filters, results, and
   role-specific destinations and authorization.
5. Preserve unrelated working-tree changes, including the existing Messages
   page changes and prompt files.

## Verification

- Run the frontend TypeScript check and lint.
- If a development server and browser session are available, check `/listings`
  at mobile and desktop widths for signed-in and signed-out states. Verify the
  signed-in hamburger opens/closes, navigation links work, and listing detail
  routes retain the portal layout.

## Acceptance criteria

- Signed-in users see consistent role-aware portal navigation on Find Homes and
  listing detail pages, without a competing public header.
- Mobile users can reach portal navigation through the hamburger drawer.
- Signed-out users retain the public header and existing redirect-to-login
  behavior.
- Listing discovery behavior and distinct student, landlord, and admin
  navigation remain unchanged.
