# Improve listing address geocoding with campus context

## Root cause

The listing form has the selected campus and its known locality, but the backend
geocodes the property address as a standalone Nominatim query. Valid addresses
in smaller South African suburbs or township areas may not resolve without
nearby city/region context.

## Implementation

- Pass the selected campus's locality and name from the listing controller into
  listing geocoding.
- Retry the property-address lookup with its selected campus locality appended,
  while requiring returned results to match that locality.
- Resolve the campus address with the same locality context and campus-name
  fallback query.
- Continue to reject unresolved or out-of-locality results. Do not substitute
  campus coordinates for property coordinates.
- Keep OSRM distance calculation server-side and preserve explicit provider
  errors.
- Add focused geocoding tests that exercise locality-assisted property lookup,
  rejection of results outside the selected campus area, and campus-name
  fallback.

## Validation

- Run the focused geocoding tests and listing-controller tests, backend
  TypeScript build, and `git diff --check`.
- Do not send the student's exact property address to external services as a
  test or create a live listing.
