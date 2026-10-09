# Improve property address geocoding result matching

## Root cause

Contextual Nominatim searches request only one result. The geocoder then rejects
that single result when its display name omits the selected locality—even if
Nominatim has another valid matching result for the same query.

## Implementation

- Request a small bounded set of Nominatim candidates (up to five) for address
  searches.
- Validate candidate coordinates and choose the first valid result whose
  display name matches the selected campus's primary locality.
- Keep contextual retries and locality checks; never accept a known result from
  a different locality and never fall back to campus coordinates.
- Preserve Nominatim's one-request-per-second throttle, existing provider error
  handling, and server-side OSRM route calculation.
- Add a focused unit test where the first search result is outside the campus
  locality but a subsequent result is valid and should be selected.

## Validation

- Run focused geocoding tests and backend TypeScript build.
- Run `git diff --check`.
- Do not send the user's address to Nominatim or submit a live listing for
  validation.
