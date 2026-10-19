# Show popular campuses two per row on mobile

Update the Popular campuses grid in `frontend/app/student/dashboard/page.tsx` to show
two campus cards per row at mobile widths.

- Keep the existing tablet two-column and desktop four-column layouts.
- Preserve campus card content, links, and ordering.
- Ensure card names remain readable and the dashboard has no horizontal overflow at a
  390px-wide viewport.

Verify the mobile grid has two columns and the desktop grid retains four columns. Run
frontend TypeScript and targeted ESLint checks.
