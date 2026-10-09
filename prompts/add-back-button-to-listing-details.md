# Add a back button to listing details

## Goal

Add a clear back button when a user views an apartment/listing detail page.

## Implementation

- In `frontend/app/listings/[id]/listing-detail.tsx`, add an accessible
  left-arrow back control near the top of the listing details.
- Use browser history when a previous in-app page exists, preserving the
  user's search context; otherwise fall back to `/listings`.
- Keep the existing “Back to search” link for listing-load errors.
- Do not alter listing details, actions, or authorization.

## Validation

- Run frontend lint for the listing detail component.
- Run `git diff --check`.
- Verify browser back works when arriving from search and falls back to the
  listings page on direct navigation.
