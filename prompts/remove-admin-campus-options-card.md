# Remove the admin campus-options card

## Goal

Remove the optional “Find campus options” panel from the Admin Add Campus page
because its Overpass lookup is unavailable in the hosted environment.

## Scope

- Remove the complete panel, including its heading, explanation, search
  button, loading state, errors, results, and OpenStreetMap card attribution.
- Remove the now-unused panel state, search handler, frontend API wrapper, and
  `CampusSuggestion` frontend type if no other frontend usage remains.
- Keep the existing institution selector, manual campus name/location/address
  fields, address-suggestion workflow, and campus save behavior unchanged.
- Keep the backend campus-suggestions API and Overpass integration available;
  this request removes the failing UI card, not the backend endpoint contract.
- Remove any operations note added specifically for the removed card. Retain
  general Overpass endpoint documentation where it remains accurate.
- Revert the now-unneeded Overpass query optimization/logging changes from the
  superseded attempt to fix the card. Preserve all unrelated in-progress
  changes, including the approved MapLibre listing route preview work and
  Nominatim diagnostics.

## Acceptance criteria

- No “Find campus options” card or associated campus-search request is shown
  or triggered on Admin Add Campus.
- An administrator can still manually enter and save a campus and can still
  use the existing address suggestion action.
- The backend `GET /api/campuses/suggestions` endpoint is not removed or
  modified by this UI change.

## Validation

- Search the frontend to confirm there are no remaining references to the
  removed card, its API method, or its unused suggestion type.
- Run the frontend TypeScript check and targeted lint.
- Verify the Add Campus form still builds and retains manual entry/address
  suggestions.
- Run `git diff --check` on the files changed for this task.
