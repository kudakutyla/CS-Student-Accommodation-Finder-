# Search campus options by selected institution

## Goal

On the Add Campus page, let an administrator search for campus suggestions
using the already selected institution name and choose a result to prefill the
campus form.

## Implementation

- Use the selected institution as the default search basis; do not require a
  separate campus-name query before searching.
- Keep an optional text field for narrowing results (for example, campus name
  or city). When supplied, search within the selected institution context.
- Reuse the authenticated admin-only backend campus suggestion endpoint and
  server-side OpenStreetMap Nominatim integration. Do not call Nominatim from
  the browser, add an API key, or introduce a new provider.
- Avoid duplicating the institution name in the Nominatim query when it is
  already the search text. Continue to restrict results to South Africa and
  university/college places, bound result count, and preserve the one-request-
  per-second Nominatim queue.
- Display matching campus suggestions as selectable options. Selecting an
  option fills campus name, address, and city/region only; the administrator
  must still explicitly submit the Add Campus form.
- Keep manual entry available and explain that OpenStreetMap is community
  data, not an authoritative or exhaustive campus directory.
- Handle empty search results and provider failures with clear states. Preserve
  existing institution selection, create-campus validation, and authorization.
- Add focused backend tests for default institution-based lookup and optional
  refinement if the current campus-suggestions unit test setup supports it.
- Update directly relevant documentation if endpoint behavior changes.
- Do not create or modify institution or campus records during implementation
  or validation.

## Validation

- Select an institution and search without typing a campus name; verify
  suggestions are requested using that institution and presented as choices.
- Add an optional search term and verify it narrows the search to that
  institution.
- Select a suggestion and verify it prefills fields without saving.
- Verify no-results/provider-error states and manual entry remain available.
- Run focused campus-suggestions tests, backend TypeScript check, frontend lint
  for the Add Campus page and API client, frontend TypeScript check, and
  `git diff --check`.
