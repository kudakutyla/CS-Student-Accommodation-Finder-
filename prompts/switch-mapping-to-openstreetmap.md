# Switch mapping services to OpenStreetMap

## Goal

Remove the backend's Google Maps API key dependency for campus and listing
location workflows. Use OpenStreetMap-based public services:

- Nominatim for server-side address geocoding.
- OSRM for server-side driving-route distance.

## Implementation

- Replace Google-specific geocoding and route requests in
  `backend/src/utils/geocode.ts` with Nominatim and OSRM requests.
- Keep coordinates and route distance server-side; do not add browser-side
  mapping calls or fallback coordinates.
- Use an identifying User-Agent for Nominatim and comply with its public
  service rate limit. Return explicit, actionable errors for failed lookups,
  rejected addresses, and malformed responses.
- Preserve existing API/controller response behavior and the current campus
  and listing validation requirements.
- Update focused geocoding tests in `backend/tests/geocode.test.ts` to verify
  request URLs, request headers, coordinate parsing, route conversion, and
  failures without requiring any live external request.
- Remove the now-unused Google Maps key from `backend/.env.example` and update
  directly related setup documentation to describe the public service limits
  and lack of uptime guarantees. Do not inspect, modify, print, or expose the
  real `backend/.env` contents.
- Do not add a map UI, extra dependencies, or unrelated changes.

## Validation

- Run the focused geocoding tests and backend TypeScript build.
- Run `git diff --check`.
- Confirm no Google Maps key is required for local campus creation.
