# Move university search before institution form

## Goal

On Admin → Campuses, show the “Find a university in South Africa” suggestion
card above the Institution name / Short name form.

## Implementation

- Reorder only the university suggestion card and institution creation form in
  `frontend/app/admin/campuses/page.tsx`.
- Keep search behavior, result selection, loading/error/retry/empty states, and
  form submission behavior unchanged.
- Keep the suggestion card hidden while editing an existing institution, as it
  is now.
- Do not change campus management or unrelated layouts.

## Validation

- Verify the university search card appears before the Institution name field.
- Run frontend lint for the page and `git diff --check`.
