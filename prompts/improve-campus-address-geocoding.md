# Improve campus address geocoding

## Goal

Fix campus creation failures when Nominatim cannot find an address submitted
without enough locality context or when the campus is more reliably indexed
by its institution/campus name.

## Implementation

- Keep all geocoding on the backend and continue using Nominatim without an API
  key.
- Allow campus geocoding to receive optional context (campus name and
  city/region) while preserving the existing exact-address behavior for other
  callers.
- Try the validated street address first, then retry with city/region and
  South Africa context. If still not found, try the campus name plus
  city/region and South Africa, only for campus creation.
- Keep Nominatim requests serialized at no more than one per second; only
  perform fallback lookups after an empty result, not after provider/network
  errors.
- Continue validating returned coordinates and surface actionable errors
  without substituting approximate or client-provided coordinates. For
  contextual retries, reject fuzzy results whose returned display address
  does not match the supplied city or region.
- Add mocked tests for contextual fallback, named-campus fallback, rate-safe
  ordered requests, and preserving provider errors.
- Update the Add Campus form guidance to explain the recommended address
  format (street address, suburb/city, and campus name when relevant).

## Validation

- Run focused geocoding tests and backend TypeScript check.
- Run frontend lint for the Add Campus page and `git diff --check`.
- Verify Nominatim resolves a known campus query without creating database
  records.
