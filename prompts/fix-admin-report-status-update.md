# Fix admin report status updates

## Problem

The live admin reports page can now load reports, but changing a report status
returns `Failed to update report status`. Report retrieval was fixed to avoid
selecting `adminReviewNote`, which is present in the Prisma schema and a local
migration but absent from the live reports table. The status-update path still
writes that column and is therefore likely failing with the same production
schema drift.

## Implementation

1. Inspect the status-update controller, report migration history, live route,
   notification/audit behavior, and existing workflow tests before editing.
2. Ensure status changes do not require the unapplied `adminReviewNote` database
   column. Preserve status persistence, audit logging, reporter notification,
   authorization, validation, and closed-report conflict behavior.
3. Preserve any submitted review note in the reporter notification and
   moderation audit description if feasible without relying on that missing
   column. Do not silently pretend the note was persisted in the Report row.
4. Keep database/transaction failures explicit and logged server-side. Do not
   make a status update appear successful if any required operation failed.
5. Add focused tests for status update with/without a note, expected Prisma
   writes, audit record, reporter notification, closed report rejection, and
   explicit database failure behavior.
6. Preserve unrelated worktree changes. Deploy only the scoped fix once tests
   and type-checks pass, then verify a real admin report status transition on
   the live page if available.

## Validation

- Confirm an `IN_REVIEW` report can be resolved or dismissed in production and
  the status refreshes in the list.
- Confirm the reporter receives a notification, including the optional note.
- Confirm the status remains unchanged and an explicit error is shown if a
  required transaction operation fails.
- Run focused report workflow tests, backend type-check, and `git diff --check`.
- Do not run unreviewed schema pushes or migrations against production.
