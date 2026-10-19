# Link Report Notifications to Their Admin Updates

## Confirmed findings

- The notifications UI already links `REPORT_STATUS` notifications with a `reportId` to `/student/reports/:id#admin-updates`.
- The status-update controller already creates new report notifications with the corresponding report ID.
- The PostgreSQL database currently configured for the backend is missing `Notification.reportId`, so notification records cannot be returned with their report association and the UI cannot navigate from them.
- Read-only matching of the seven existing report-status notifications against report-status audit entries found a unique report match for each, using reporting-student ownership, listing title, matching status, and nearest audit timestamp (within 60 seconds).
- The database has other unapplied migrations despite some migration-created objects already existing. Do not run a blanket `prisma migrate deploy` or `prisma db push`.

## Implementation

- Update the existing `20261016000000_link_report_status_notifications` migration to add a safe historical backfill before its foreign-key constraint. Link only notifications for which the candidate report is unique; never guess on ambiguous matches.
- Apply only this migration's narrowly scoped additive SQL against the configured database. Re-inspect the target schema first, make the SQL safe to re-run if the column/index/constraint already exists, and do not expose credentials or notification contents.
- Verify all existing report-status notifications that can be uniquely matched now contain their proper `reportId`, and that the FK/index are present.
- Keep notification UI behavior as report-specific navigation to the `#admin-updates` section, mark unread notifications read on click, and preserve existing behavior for unrelated notifications.
- Confirm a newly created report-status notification also retains its report reference.
- Do not change unrelated migration history or apply other migrations.

## Validation

- Run focused notification/admin-report tests, backend type-check, and `git diff --check`.
- Verify that clicking a report-status notification opens the exact student's report at its **Admin updates about this report** section.
- Preserve unrelated worktree changes; do not commit.
