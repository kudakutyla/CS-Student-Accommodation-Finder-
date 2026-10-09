# Link institution management to campus creation

## Goal

Make the institution-to-campus workflow explicit and accessible for both new
and existing institutions. Each institution can have multiple campuses.

## Implementation

- Preserve the existing successful “Add institution” redirect to
  `/admin/campuses/add?institutionId=...`.
- On the institution list, add an “Add campus” action for active institutions,
  linking to the Add Campus page with that institution preselected.
- On the Add Campus page, show the selected institution's name and make clear
  that additional campuses can be added to it. After a successful campus
  creation, keep the institution selected and allow another campus to be
  entered.
- Update the legacy Step 2 campus helper text on the management page to refer
  to OpenStreetMap instead of Google Maps.
- Preserve existing campus and institution management behavior otherwise.

## Validation

- Run frontend lint for both campus pages.
- Run the frontend TypeScript check and `git diff --check`.
- Verify links preserve the institution ID and successful campus creation
  leaves the form ready to add another campus to the selected institution.
