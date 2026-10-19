# Show total listing count in filter header

Update `frontend/app/listings/page.tsx` so the listing total appears inside the
collapsible **Adjust filters** card header, on the right immediately beside the dropdown
chevron.

- Remove the separate results-count card below the filter sidebar.
- Display only the number, using the API's total-result pagination value (not the current
  page's item count); do not show a stale or misleading zero while results are loading.
- Keep existing loading, error, empty-results messaging, filter controls, and expand/
  collapse behavior.
- Keep the count visually compact and accessible with a descriptive accessible label.

Verify that the count updates from the listing response, the separate count card is gone,
and the filter header still opens/closes on mobile. Run frontend TypeScript and targeted
ESLint checks.
