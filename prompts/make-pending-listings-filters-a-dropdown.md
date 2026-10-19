# Make pending listings filters a dropdown

Update the filter section in `frontend/app/admin/pending-listings/page.tsx`.

## Requirements

- Use the collapsed-by-default dropdown-card pattern established on Admin → Audit history.
- Keep the existing pending-listings filter controls and behavior: residence search, submitted-from date, submitted-to date, Clear filters, invalid date-range feedback, and the filtered-results count.
- Keep the existing filter section visibility behavior while listings are loading or an error is shown.
- Add a compact “Adjust filters” header with a clear expand/collapse icon and accessible button semantics (`aria-expanded` and `aria-controls`).
- Do not change search/date filtering logic, moderation actions, or unrelated files.
- Run `npx tsc --noEmit` and lint the updated page.
