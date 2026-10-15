# Show OpenStreetMap campus options by institution

## Goal

When an administrator presses “Find campus options” on Add Campus, show the
mapped OpenStreetMap campuses associated with the selected institution, without
requiring a campus-name search term.

## Implementation

- Replace the current Nominatim text search for campus suggestions with a
  server-side Overpass API query for South African OpenStreetMap university and
  college features associated with the selected institution by `operator`,
  `brand`, or `name` tags.
- Keep the route authenticated and admin-only. Accept the institution ID,
  validate it, and resolve the active institution name from the database. Do
  not accept an arbitrary institution name from the browser as authority.
- Escape the resolved institution name for Overpass regular expressions and
  for QL string literals. Keep the query scoped to South Africa, explicitly
  user-triggered, bounded in timeout/result count, and send a descriptive
  backend User-Agent. Treat upstream timeouts, rate limits, malformed responses,
  and non-2xx responses as explicit service errors.
- Parse only valid amenity university/college elements. Support OSM node
  coordinates and way/relation `center` coordinates; use tags to format campus
  name, city/region, and address. Deduplicate results and sort by campus name.
  Return a small bounded list; do not expose coordinates unless the existing
  API contract needs them.
- Do not claim the list is exhaustive: OpenStreetMap contains only mapped and
  tagged places. Make clear in the UI that unmapped/mistagged campuses need
  manual entry.
- Remove the optional campus/city search field. The institution selector plus
  “Find campus options” action is the whole search. Selecting a result should
  fill the form and not save it; the administrator must still submit Add Campus.
- Preserve manual entry, existing backend address geocoding on save, and
  institution selection behavior.
- Update `frontend/lib/api.ts`, Add Campus UI, controller/route as needed,
  focused tests, API contract documentation in `AGENTS.md`, and OpenStreetMap
  operational notes in `RELEASE-OPERATIONS.md`.
- Do not make a campus or institution database record during the change or
  validation. Do not add dependencies or frontend provider calls.

## Validation

- Unit-test query construction and regex escaping, response parsing for node
  and way/relation results, deduplication, empty results, invalid payload,
  upstream failure, and institution authorization/active-status validation.
- Run focused backend tests and backend TypeScript check.
- Run frontend lint for Add Campus and API client, frontend TypeScript check,
  and `git diff --check`.
- In the UI, select an institution and press “Find campus options”; verify a
  set of mapped options appears without entering a search phrase, selecting an
  option fills the form only, and manual entry remains possible.
