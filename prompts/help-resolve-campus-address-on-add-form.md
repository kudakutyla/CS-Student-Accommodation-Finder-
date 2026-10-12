# Help resolve campus addresses in the add-campus form

## Goal

Make it easier for admins to enter a campus address when the address they type
cannot be resolved during campus creation.

## Implementation

- Add an admin-authenticated backend endpoint that searches OpenStreetMap
  Nominatim for South African address candidates using the entered address,
  campus city/region, and campus name as fallback context.
- Return only validated, locality-matching formatted address strings; do not
  return or accept client-supplied coordinates.
- Reuse the existing serialized Nominatim request helper, retain the existing
  provider error behavior, and only try contextual queries after empty or
  unusable results.
- In the add-campus form, add a clear “Find matching addresses” action under
  the address field. Display loading, provider-error, and no-match feedback,
  and let the admin select a candidate to fill the address input.
- Keep existing institution campus suggestions, manual address entry, save
  validation, and server-side geocoding behavior intact.
- Add focused tests for locality filtering, contextual fallback, provider
  errors, endpoint authorization/validation behavior where feasible, and
  candidate selection data shape.

## Validation

- Run focused backend tests for geocoding and campus address suggestions.
- Run backend TypeScript check and frontend lint/type-check for the edited
  page.
- Run `git diff --check`.
