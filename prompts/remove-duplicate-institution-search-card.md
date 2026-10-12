# Remove the duplicate institution search card

## Goal

Remove the second “Find a university in South Africa” search card from
`/admin/campuses`; keep the search card above the institution form.

## Implementation

- Remove only the duplicate search card rendered after the Add institution
  form.
- Preserve the existing university search, suggestion, retry, and selection
  behavior in the first card.
- Keep institution create/edit controls and institution list behavior
  unchanged.

## Validation

- Run frontend lint for `app/admin/campuses/page.tsx`.
- Run `git diff --check`.
