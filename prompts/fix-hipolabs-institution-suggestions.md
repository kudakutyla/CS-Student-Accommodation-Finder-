# Fix dynamic Hipolabs institution suggestions

## Goal

Make the admin institution form reliably retrieve university suggestions from the
Hipolabs Universities API, replacing any need for a hardcoded institution list.
Preserve the student discovery flow: students select an institution and campus
from the persisted app catalog, and campus options remain scoped to the selected
institution.

## Existing behavior and constraints

- `GET /api/campuses/institutions/suggestions` is an admin-protected backend
  endpoint that proxies `https://universities.hipolabs.com/search`.
- The admin campuses page debounces input, shows loading/error/empty states, and
  lets an administrator copy a suggestion into the institution form before
  saving it to the database.
- Student and listing institution/campus selectors are populated from the
  persisted institution and campus API responses. Do not replace these
  database-backed records with transient Hipolabs results.
- The current admin UI reports that the university suggestion service is
  temporarily unavailable. Find the actual cause; do not mask upstream failures
  with fake or hardcoded results.
- Keep upstream requests on the backend, retain admin authorization, bound and
  validate input and returned data, and return only normalized fields required
  by the UI. Do not expose credentials or add browser-side requests to Hipolabs.
- Preserve existing institution uniqueness, campus linking, listing visibility,
  and authorization behavior.

## Implementation

1. Inspect the current backend proxy, route middleware, frontend API wrapper,
   admin form behavior, tests, and environment/runtime compatibility. Determine
   why the suggestion request fails in the affected runtime and correct that
   cause rather than weakening validation or returning a success-shaped
   fallback.
2. Keep requests restricted to South African universities, with bounded search
   terms, a reasonable response timeout, and a capped normalized result set.
   Surface upstream HTTP, timeout, network, and invalid-payload failures
   explicitly using the existing API response contract.
3. Ensure suggestion state cannot display stale results after a newer query or
   after the input is cleared. Preserve clear loading, no-results, and error
   feedback. Provide an accessible way to retry a failed suggestion lookup if
   the existing interaction does not offer one.
4. Keep selected suggestions as form values only until an administrator
   explicitly saves the institution. Successful persistence must continue to
   make the institution available to students through the normal database-backed
   institution/campus flow.
5. Add or update focused backend tests for the Hipolabs query, normalized and
   bounded responses, invalid input/payload, non-OK upstream response, timeout
   or network failure, and admin-only access. Add focused frontend coverage if
   the repository already has a suitable test setup; do not introduce a new test
   framework solely for this change.
6. Update directly related API documentation only if the project documents
   this endpoint elsewhere.

## Validation

- Verify the admin suggestions call queries Hipolabs through the backend and
  that no university list is hardcoded as a fallback.
- Verify admin suggestions can populate the institution form, but are not
  persisted until the administrator saves.
- Verify student Institution → Campus selection still uses saved records and
  only shows campuses linked to the selected institution.
- Verify upstream/network/timeout/payload failures produce visible errors and
  never appear as successful empty results.
- Run the focused backend tests, applicable frontend checks, and
  `git diff --check`.
