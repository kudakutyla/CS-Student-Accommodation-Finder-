# Match Find Homes layout to the student portal

## Goal

Make the authenticated Find Homes (`/listings`) page match the student portal
layout shown by Saved Homes: keep the shared top area limited to the Abode brand
and portal subtitle/navigation toggle, with navigation in the portal sidebar,
not the general Navbar. Use the same clean page-title header treatment as Saved
Homes.

## Implementation

1. Inspect the route-role logic in `frontend/components/app-shell.tsx`, the
   general `Navbar`, and the `/listings` page before editing.
2. Route authenticated `/listings` visits through the appropriate portal shell:
   student role gets the student portal and landlord role gets the provider
   portal. Preserve role-aware sidebar links and the existing unauthenticated
   sign-in redirect behavior.
3. Avoid showing the full general Navbar on `/listings` while auth is still
   initializing; avoid an authenticated header flash. If the user is
   unauthenticated, preserve the existing redirect to sign-in.
4. Replace the large search hero card with the page-title layout pattern used
   by Saved Homes: small eyebrow, clear page heading, bottom border, and
   optional role-appropriate action if helpful. Search filters and listing
   results stay in the page content below.
5. Do not alter search filters, URL query initialization, pagination, listing
   API behavior, or listing cards. Keep responsive layout intact.
6. Do not put page actions, account controls, or navigation links into the
   header. Keep them in the sidebar or page content.

## Validation

- Run frontend lint for the modified files and the production build.
- Verify authenticated students and landlords use their role-appropriate shell
  on `/listings`; verify unauthenticated visits still redirect to login.
- Verify the Find Homes heading matches the Saved Homes content-page treatment
  and no general Navbar actions appear above it.
- Verify current query filters and results remain unchanged.
- Run `git diff --check`.
