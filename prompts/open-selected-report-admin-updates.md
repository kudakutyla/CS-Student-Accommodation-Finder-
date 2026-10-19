# Open Selected Report Admin Updates

Update student report navigation so selecting a submitted report opens the detail view for that exact report and lands at its admin-updates section.

## Scope

- Make the submitted report row/title a clear link to that report's detail view, rather than sending the user to the associated accommodation listing.
- Keep a separate accommodation link available for users who want to open the listing.
- Give the per-report admin-updates section a stable fragment target and title it clearly as **Admin updates about this report**.
- Route report-status notifications to the same report-specific updates section; preserve mark-as-read behavior.
- Ensure the destination is report-specific, remains authenticated/student-only through existing backend/API protections, and behaves correctly on direct page loads and refreshes.
- Preserve the existing loading/error/empty states and responsive layout. Do not add mock data or change report APIs.

## Validation

- Run focused frontend type-check and lint on the changed pages, plus `git diff --check`.
- Verify navigation from a submitted report and a report-status notification opens the correct report's admin update section.
- Preserve unrelated worktree changes and do not commit.
