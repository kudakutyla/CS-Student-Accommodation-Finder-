# Complete institution-to-campus flow and Google Maps configuration

## Goals

Complete the admin institution workflow so creating an institution leads
directly to its detail page and campus form, use live Hipolabs university
suggestions instead of a hardcoded institution list, and configure address
geocoding and route distances with the backend-only Google Maps key.

## Implementation

1. Inspect the existing worktree changes first. Preserve unrelated user changes
   and integrate with the current API, authentication, validation, and admin
   page patterns.
2. Verify that saving a new institution navigates to its detail page only after
   a successful API response. On that page, show the institution's campuses,
   allow viewing/editing them, and make **Add Campus** open the campus form
   immediately with that institution selected. Keep institution editing and
   campus management admin-only, and surface loading, empty, and request-error
   states.
3. Use the Hipolabs Universities API dynamically for searchable institution
   suggestions. Fetch through the backend, validate and bound upstream input
   and output, expose only the required normalized fields, and show explicit
   loading, empty, and upstream-failure states. Do not replace the persistent
   institution records with mock or hardcoded data.
4. Keep campus geocoding, property geocoding, and campus-to-property route
   distance calculation on the backend. Read `GOOGLE_MAPS_API_KEY` only from
   the backend environment. Never add the key to frontend variables, API
   responses, source files, documentation examples, logs, or commits.
5. Verify and document the Google Cloud requirements for the deployed key:
   enable the Geocoding API and Routes API, configure billing and appropriate
   server-side restrictions, and set `GOOGLE_MAPS_API_KEY` as a private
   environment variable on the deployed backend service. Do not commit a
   credential or substitute campus coordinates if the key or a Maps request
   fails. If deployment-secret access or the owner's key is unavailable,
   complete the code and report the precise secure dashboard action still
   required; never ask the user to paste the key into chat.
6. Preserve existing listing approval, validated-address, and server-side
   distance rules. Surface configuration/service failures explicitly to the
   caller.
7. Add or extend focused tests for the Hipolabs lookup and failures, institution
   navigation/campus prefilling where a frontend test setup exists, and Google
   Maps configuration and request behavior. Preserve unrelated local changes.

## Validation

- Confirm a successful institution create/edit opens the corresponding
  institution detail page.
- Confirm **Add Campus** opens the form with the correct institution already
  selected, and that campus records load and can be edited.
- Confirm Hipolabs suggestions are fetched dynamically through the backend and
  errors/empty results are visible.
- Confirm missing/invalid Maps configuration returns explicit errors and never
  falls back to client-side or campus-coordinate distance calculation.
- Run focused backend tests, backend type-check, frontend lint/build, and
  `git diff --check`.
- If the backend deployment key is configured, verify campus creation and
  listing submission against the deployed API without revealing the key.
