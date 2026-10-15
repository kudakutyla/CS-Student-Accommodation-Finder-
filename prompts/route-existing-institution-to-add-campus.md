# Route existing institutions to Add Campus

## Goal

Make the “Add institution” action continue to the Add Campus page when the
entered institution already exists, rather than leaving an administrator on a
duplicate-name error when they are trying to add a campus to that institution.

## Implementation

- Preserve the existing behavior for a newly created institution: after a
  successful create response, navigate to
  `/admin/campuses/add?institutionId=<returned institution id>`.
- Before creating, compare the normalized institution name with active
  institutions already loaded in the admin catalog. If an exact case-insensitive
  match exists, navigate to that institution's Add Campus page instead of
  submitting a duplicate.
- If the create request reports a duplicate despite no local match (for
  example, stale catalog state), refresh the admin institution list and
  navigate only if an exact normalized active-institution match is found.
  Otherwise preserve and display the API error.
- Do not route approximate matches, inactive institutions, or unrelated API
  failures. Keep institution editing behavior unchanged.
- Retain the selected institution and existing Add Campus form behavior.
- Keep campus suggestions backed by the existing authenticated backend
  endpoint using OpenStreetMap Nominatim. It can suggest mapped university and
  college places near the selected institution, but it is not an authoritative
  registry of every institution's campuses; preserve manual entry and explicit
  campus submission.

## Validation

- Verify successful creation navigates to Add Campus with the returned ID.
- Verify submitting the exact name of an existing active institution navigates
  to Add Campus with that institution selected and does not create a duplicate.
- Verify inactive or non-matching names and non-duplicate API failures continue
  to show the appropriate error without navigating.
- Run focused frontend lint, TypeScript check, and `git diff --check`.
- Do not create or modify any institution or campus records as part of
  validation.
