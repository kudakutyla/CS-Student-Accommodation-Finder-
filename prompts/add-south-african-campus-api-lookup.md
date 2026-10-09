# Add South African campus API lookup

## Goal

Let administrators search the public South African OpenStreetMap data for
campuses while filling the Add Campus form, then select a result to populate
the form before explicitly saving it.

## Implementation

- Add an authenticated, admin-only backend campus-suggestions endpoint. It
  queries Nominatim server-side, scoped to South Africa, and combines the
  search text with the selected institution name.
- Use the existing Nominatim request queue/User-Agent and preserve its
  one-request-per-second limit. This must be explicit search (button/form
  submit), not per-keystroke autocomplete, to comply with the public
  Nominatim usage policy.
- Validate query length and institution ID; return only a small bounded set of
  usable university/college place results with a display name, address, and
  location fields where available. Treat upstream errors/malformed results as
  explicit API errors.
- Wire frontend lookup through `frontend/lib/api.ts`. Add a “Search campuses”
  field/action on `frontend/app/admin/campuses/add/page.tsx`; selecting a
  suggestion fills campus name, address, and city/region but does not save the
  record. The admin must still explicitly press “Add campus”.
- Keep manual entry available if no API result is found or the API is
  unavailable. Continue server-side geocoding on campus creation; do not trust
  suggestion-provided coordinates or add browser-side geocoding.
- Add focused backend tests for authorization, query construction, parsing,
  empty/malformed responses, and provider failure. Update directly relevant
  API documentation and Nominatim usage notes.
- Do not create a campus record or mutate the database as part of this change.

## Validation

- Run focused campus-suggestions tests and backend TypeScript check.
- Run frontend lint for the Add Campus page and frontend TypeScript check.
- Run `git diff --check`.
- Verify lookup selection populates fields only and leaves final campus saving
  to the administrator.
