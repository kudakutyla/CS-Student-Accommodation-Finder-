# Align student listing filters with the admin filter card

Update the authenticated student Find Homes page at `frontend/app/listings/page.tsx`.

## Requirements

- Keep the “Adjust filters” card collapsed by default.
- Preserve the current expandable/collapsible header, result count, filter state, and filtering behavior.
- When expanded, use the same filter-card layout as the admin audit-history page at `frontend/app/admin/audit-history/page.tsx`: a warm-white rounded bordered card with vertically stacked, full-width labeled controls and the action buttons underneath.
- Keep all existing student filter controls: institution, campus, property keyword, minimum and maximum price, type, availability, and sort.
- Keep the panel responsive and consistent with the existing visual theme.
- Do not change filtering semantics, API requests, or unrelated files.
- Run the frontend TypeScript check (`npx tsc --noEmit`) after implementation.
