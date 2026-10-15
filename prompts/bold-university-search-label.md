# Bold the university search label

## Goal

Make “Find a university in South Africa” visually bold on Admin → Campuses.

## Implementation

- Update only the label text styling in `frontend/app/admin/campuses/page.tsx`.
- Preserve the search input, suggestion behavior, and surrounding card layout.
- Use the existing Tailwind styling conventions.

## Validation

- Confirm the label has bold font styling.
- Run frontend lint for the page and `git diff --check`.
