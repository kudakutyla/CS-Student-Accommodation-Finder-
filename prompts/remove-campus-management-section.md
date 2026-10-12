# Remove the inline campus management section

## Goal

Remove the entire Step 2 / Campuses area from `/admin/campuses`, including the
geocoding description, inline campus creation/edit form, and the list of saved
campuses shown beneath it.

## Implementation

- Keep the Institutions section and its university suggestions, create/edit,
  activation controls, and institution campus-management/add-campus links.
- Remove only the inline campus form and campus list section from this page.
- Remove campus-only state, handlers, and page-load API calls that become
  unused. Refresh and institution save flows should continue to refresh
  institution data and preserve existing success/error behavior.
- Do not remove campus management functionality from the dedicated campus
  pages reached through the existing links.
- Update the page heading to accurately describe the remaining institution
  management page.

## Validation

- Run frontend lint for `app/admin/campuses/page.tsx`.
- Run `git diff --check`.
