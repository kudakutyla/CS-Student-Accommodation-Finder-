# Fix campus address geocoding locality matching

## Goal

Fix campus creation when OpenStreetMap resolves a real campus address but its
result uses a different city or metro name from the admin-entered locality.
The form currently reports that the address could not be resolved in this case.

## Root cause

`createCampus` passes the campus location and campus name to
`resolveAddressCoordinates`, which retries with contextual queries. However,
the geocoder only accepts results whose `display_name` includes the first
comma-separated locality component exactly as entered. Valid South African
results that name the corresponding metro, suburb, or region differently are
discarded, including results from the campus-name fallback. Campus creation
also does not set the campus-specific error label, so the final error message
is misleadingly generic.

## Implementation

- Update contextual result validation so a candidate can match a supplied
  locality component (city or region), rather than requiring only the first
  component to occur verbatim. Keep rejecting candidates that do not match any
  supplied locality component; do not accept arbitrary national results.
- Preserve the ordered lookup behavior: exact address, address with locality,
  then campus name with locality. Do not retry after network or provider
  errors, and keep Nominatim requests serialized.
- Set the campus label at the campus creation call site so unresolved campuses
  receive the actionable campus-specific error.
- Keep all geocoding server-side and continue storing only validated
  OpenStreetMap coordinates. Do not trust client coordinates or substitute
  coordinates when lookup fails.
- Add focused tests for matching an alternate locality component and rejecting
  candidates outside all supplied locality components. Verify ordered
  contextual queries and campus-specific unresolved errors.
- Preserve listing geocoding locality protections and existing campus
  creation behavior.

## Validation

- Run the focused backend geocoding tests and campus-related tests.
- Run the backend TypeScript check/build.
- Run `git diff --check`.
