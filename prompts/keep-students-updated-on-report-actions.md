# Keep students updated on report moderation actions

## Goal

Ensure admin report actions keep the reporting student informed and deliver an
optional message when the admin submits one.

## Confirmed behavior

- Show **Mark under review** only while a report is `PENDING`.
- Show **Resolve** and **Dismiss** while a report is `PENDING` or `IN_REVIEW`.
- Do not show moderation actions for `RESOLVED` or `DISMISSED` reports.
- Report status updates are delivered through the app's existing
  student-facing `REPORT_STATUS` notification workflow.

## Implementation

1. Inspect the current admin reports UI, report-status API/controller, student
   notification listing, and tests before editing. Preserve unrelated worktree
   changes.
2. Verify each available action (`IN_REVIEW`, `RESOLVED`, and `DISMISSED`)
   persists the report's new status and creates a notification for the report's
   `userId`, not the admin or listing owner.
3. When an admin enters an optional message, include it in the student's
   notification. Preserve support for status changes without a message. Do not
   claim the optional note is stored in the Report row if the production schema
   does not include that column.
4. Keep status, audit record, and student notification atomic under the
   existing transaction. Surface failures explicitly; never report success or
   display a success notice if notification delivery/persistence fails.
5. Keep **Mark under review** visible only for `PENDING`, per the confirmed
   workflow. Keep the textarea and action loading/disabled behavior clear so an
   admin sees which message will accompany the selected action.
6. Add or extend focused tests for all three transitions, student recipient,
   optional message included/omitted, transaction rollback/failure behavior,
   and closed-report action visibility/validation where a frontend runner
   exists.
7. Preserve backend authorization, notification privacy, audit logging, and
   deployed-schema compatibility. Do not introduce an external email or chat
   dependency unless an existing explicit contract already requires it.

## Validation

- Transition a pending report to `IN_REVIEW` and verify the student receives a
  status notification.
- Resolve or dismiss an open report with and without an optional message and
  verify the student receives the matching status and message.
- Verify completed reports cannot be actioned again.
- Run focused report workflow tests, backend type-check, relevant frontend
  lint/build, and `git diff --check`.
- Deploy only the scoped changes and verify the live admin report flow if
  deployment is requested/available.
