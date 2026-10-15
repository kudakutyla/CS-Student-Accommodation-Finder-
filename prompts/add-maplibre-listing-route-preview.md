# Add a MapLibre driving-route preview to listing creation

## Goal

Let a verified landlord preview the driving route and server-calculated
distance from an entered property address to the selected campus on the listing
creation form, before submitting the listing.

## Existing behavior

Listing creation already geocodes both addresses server-side with Nominatim,
calculates driving distance server-side with OSRM, and stores that distance
with the listing. The landlord form does not currently show a map or distance
preview. MapLibre is not installed or configured.

## Implementation

- Add a verified-landlord-only `POST /api/listings/location-preview` endpoint.
  Validate `campusId` and `address`; load the selected active campus from the
  database; resolve both addresses and retrieve a driving route on the backend.
  Do not persist a listing or accept campus/property coordinates from the
  client.
- Extend the existing OSRM route helper to request a bounded GeoJSON route
  geometry as well as route distance. Return the geometry, distance in km,
  and validated endpoints from the preview API. Keep server-side routing as
  the authority; MapLibre only renders the returned route and must not compute
  distance in the browser.
- Preserve listing submission behavior: geocode and calculate the route again
  on the server before saving, rather than trusting a possibly stale preview.
- Add a client-only MapLibre component, dynamically imported without server
  rendering. Use OpenStreetMap public raster tiles for this low-volume use,
  display required OpenStreetMap attribution, and show the returned route
  line, property marker, campus marker, and server-calculated distance.
- Add an explicit “Preview route” action to the landlord listing form. Require
  a selected campus and a sufficiently complete address; expose loading and
  provider failure states. Clear stale preview data when its address or campus
  changes. Do not trigger repeated requests on every keystroke.
- Keep the map component visually consistent with the existing form. Ensure
  a failed preview does not block the existing submit flow; submission must
  still report its own server-side geocoding/routing errors clearly.
- Add the MapLibre dependency and global stylesheet setup using existing
  frontend conventions.
- Update `AGENTS.md` API/architecture notes with the preview endpoint and
  clarify that MapLibre is display-only while coordinates, route geometry,
  and distance are calculated server-side.
- Update `RELEASE-OPERATIONS.md` to document OpenStreetMap raster tile
  attribution, public tile usage limits/no SLA, low-volume use only, and the
  need for a self-hosted or contracted tile provider before scaling.
- Add automated backend tests for request validation, active campus
  selection, verified-landlord authorization, returned route geometry and
  distance, provider failures, and no database mutation. Add frontend
  validation for stale preview clearing and preview error/loading behavior
  using established test patterns if present.

## Acceptance criteria

- Selecting an active campus and entering a property address, then activating
  “Preview route”, displays the actual OSRM driving path and distance returned
  by the backend on an attributed MapLibre map.
- Editing the address or changing campus invalidates the prior preview.
- The endpoint rejects unauthenticated, non-landlord, unverified, malformed,
  and unavailable-campus requests.
- The browser never geocodes, calculates route distance, or supplies trusted
  coordinates; it only renders validated backend results.
- Submitting a listing persists only fresh server-calculated coordinates and
  distance, irrespective of any preview response.

## Validation

- Run focused backend route/geocoding tests, including authorization and
  provider-failure cases.
- Run focused frontend lint/type checks and build.
- Run the backend build and `git diff --check`.
- Manually verify listing form preview, stale-preview invalidation, an
  unavailable-provider error, and normal server-side listing submission using
  an isolated test account/database.
