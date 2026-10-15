# Apply listing filters and add student report tracking

## Goals

1. Make it clear how students apply their selected listing filters by adding an
   explicit Apply filters action.
2. Give students a protected page to view reports they submitted and updates
   sent by admins while reviewing those reports.

## Listing filters

- Preserve the existing filter fields, API criteria, initial values from URL
  query parameters, and result-card behavior.
- Separate editable filter values from the filter set currently applied to the
  listings request. Editing any field must not reload results until the student
  presses “Apply filters”.
- Applying filters sends the selected criteria to the existing listing search
  API and resets pagination to the first page.
- Keep “Reset filters”; it clears both editable and applied values and loads
  unfiltered results.
- Ensure changing institution clears the campus selection in the draft; apply
  then uses the updated institution/campus together.
- Show the result loading/error state as today. Do not add unrelated filtering
  criteria or alter backend search behavior.

## Student reports page

- Add a student-only authenticated `GET /api/reports/mine` endpoint returning
  only the authenticated student’s reports, ordered newest first, with report
  reason/details/status/dates and safe listing ID/title information.
- Mount this route under `/api/reports` and preserve existing report submission
  at `POST /api/listings/:id/reports`.
- Add a `/student/reports` page and student portal navigation item. Restrict it
  to students; do not expose another student’s reports or admin-only report
  details.
- Display report cards with listing link, reason, submitted details, current
  status, and submitted/updated dates.
- Display the student’s existing `REPORT_STATUS` notifications as an admin
  update feed on this page. Admin status changes already notify the reporter
  and include any supplied admin note; use the notification API rather than
  relying on the pending `Report.adminReviewNote` database migration. Do not
  alter or require that migration, and do not mark notifications read
  automatically.
- Include loading, empty, error/retry states and a refresh action. No mock
  reports or fake data.
- Update the API contract in `AGENTS.md`.

## Validation

- Add focused backend unit coverage proving report queries are scoped by the
  authenticated user and errors are surfaced; maintain student-only route
  authorization.
- Run focused backend tests, backend TypeScript check, lint on changed
  frontend files, frontend TypeScript check, and `git diff --check`.
- Verify in the browser that draft filter changes do not update results until
  Apply is pressed, Reset clears and reapplies, report history shows only the
  signed-in student's records, and admin status notifications appear in the
  report page.
- Use an isolated/test dataset; do not create or change shared/production
  reports or listings for validation.
