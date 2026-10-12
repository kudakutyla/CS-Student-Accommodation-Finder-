# Fix report status update schema drift

## Reproduced failure

On the live admin reports page, clicking **Resolve** sends the expected
`PATCH /api/admin/reports/:id/status` request, which returns HTTP 500. The
report remains `IN_REVIEW`.

The production Report table is missing the `adminReviewNote` column: an earlier
report-fetch failure was fixed by selecting only existing Report columns. The
status-update handler still calls `report.findUnique` with `include` only,
which implicitly selects every scalar Report column, including
`adminReviewNote`, before starting its transaction.

## Implementation

1. Change the status-update lookup to explicitly select only `id`, `userId`,
   `status`, and the related listing's `title`; do not select
   `adminReviewNote`.
2. Preserve the status write, audit entry, reporter notification, optional
   message delivery, transaction atomicity, authorization, validation, and
   already-closed conflict behavior.
3. Add a regression test asserting the update lookup selects only those fields
   and never implicitly loads the missing review-note column. Retain tests for
   successful status transitions and notification delivery.
4. Preserve unrelated worktree changes. Run report-focused tests, backend
   type-check, and `git diff --check`.
5. Deploy only the scoped report fix, then perform a live admin status
   transition and verify both the new status and student notification.

## Validation

- Resolve or dismiss the currently `IN_REVIEW` report successfully.
- Confirm a refresh shows the new final status and the report cannot be
  actioned again.
- Confirm the reporter receives the corresponding in-app update, including an
  optional admin message.
- Do not run schema pushes, resets, or unreviewed migrations against production.
