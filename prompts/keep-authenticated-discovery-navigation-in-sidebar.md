# Keep authenticated discovery navigation in the sidebar

## Problem

Authenticated users visiting `/listings` (including listing detail routes) are
rendered through the public `Navbar` because `getRouteRole` does not associate
those routes with the signed-in user's role. This puts portal actions such as
Find Accommodation, Saved Homes, Messages, Updates, and Profile in a crowded
horizontal header instead of the role-aware sidebar.

The current desktop sidebar breakpoint is `lg` (1024px), so medium/tablet
viewport widths also use the compact header plus drawer instead of a persistent
sidebar.

## Implementation

1. When an authenticated role is available, route `/listings` and its detail
   routes through that role's `AppShell` sidebar. Preserve the public `Navbar`
   for signed-out visitors.
2. Use the existing medium breakpoint for the persistent portal sidebar and
   corresponding layout classes so it is present at tablet widths. Preserve a
   usable slide-out navigation drawer on narrow mobile screens.
3. Keep role-specific destinations and access protection unchanged. Ensure
   students get Find Homes, Saved Homes, Messages, Updates, and Profile, while
   landlord/admin navigation remains distinct.
4. Prevent the authenticated public navbar from duplicating or squeezing portal
   links on role-aware discovery routes.

## Verification

Run the frontend TypeScript check, lint, and production build. If browser
validation is available, check a signed-in student at desktop, tablet, and
mobile widths and verify sidebar/drawer navigation and listing detail routes.
Check a signed-out visitor still sees the public navigation.

## Acceptance criteria

- A signed-in student on `/listings` or `/listings/:id` sees portal navigation in
  the sidebar at desktop/tablet widths, not a crowded horizontal header.
- On narrow screens, navigation remains available through the mobile drawer and
  does not spill into the page footer.
- Signed-out listing discovery remains public and retains the public navbar.
