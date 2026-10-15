# Notify students when admins review reports

## Goal

When an administrator marks a report in review, resolves it, or dismisses it,
persist the status change and notify the reporting student with the new status
and any message entered by the administrator. The student must be able to see
that notification on the existing Notifications page.

## Findings and constraints

- The report status controller already attempts to update `Report.status` and
  create a `REPORT_STATUS` notification in a Prisma transaction.
- Local backend logs showed `P2022`: the connected database does not have
  `Report.adminReviewNote`. The migration adding it is pending, and the local
  connection is Neon.
- Do not apply migrations, `db push`, or otherwise mutate the configured
  external database.
- The admin report-list query now explicitly selects page fields and avoids the
  missing note column. Preserve that behavior.
- Students already load and display in-app notifications at `/notifications`.

## Implementation

1. Inspect the current `updateReportStatus` controller, report model, admin
   reports UI, notification endpoint/UI, and existing report tests.
2. Make report lookup and status update explicit `select` queries so they never
   select the absent `adminReviewNote` column implicitly.
3. Persist the requested report status, admin audit log, and student
   `REPORT_STATUS` notification atomically in one Prisma transaction. Include
   the listing title and new human-readable status in the notification message.
4. Include the trimmed admin message in that student notification. Do not
   persist the message to `Report.adminReviewNote` while its column may be
   absent. Empty/whitespace-only messages must be omitted.
5. Preserve status validation, terminal-status conflict behavior, role
   authorization, response envelope, and explicit failure reporting.
6. Ensure the admin UI only displays the “student has been notified” success
   state when the API call succeeds. Continue refreshing the report status
   after success.
7. Add focused unit tests proving the selected DB fields avoid
   `adminReviewNote`, and that each successful status action updates the status
   and creates a notification for the report's student containing the resulting
   status and optional admin message. Include a failed transaction case if
   practical.
8. Do not apply database migrations or alter unrelated worktree changes.

## Validation

- Run focused report-controller tests and backend type-check/build.
- Run frontend lint for the admin reports page.
- Verify the student notification remains visible through the existing
  `/notifications` API and page behavior.
- Run `git diff --check`.
- Report that the separate review-note column migration has not been applied;
  notification delivery must not depend on it.
