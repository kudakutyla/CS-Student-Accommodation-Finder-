# Remove the homepage campus search card

## Objective

Remove the "Find accommodation near your campus" search card and its fields from
the homepage hero.

## Implementation

- Remove the search form, its filter state, submit handler, and now-unused
  authentication/router and institution-fetching dependencies from
  `frontend/app/page.tsx`.
- Keep the hero heading, description, background imagery, campus-community
  section, featured listings, and their data loading intact.
- Adjust the hero layout so the remaining content is balanced on mobile and
  desktop rather than leaving an empty form column.
- Keep campus data loading for the campus-community cards. Update any related
  error message so it no longer refers to unavailable homepage filters.

## Verification

- Run the frontend TypeScript check.
- Verify the homepage no longer contains the search card and that the campus and
  featured-listing sections continue to load.
