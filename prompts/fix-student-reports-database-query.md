# Fix Student Reports Fetch Failure

## Confirmed findings

- The authenticated `GET /api/reports/mine` request returns HTTP 500 with the API's `Failed to fetch your reports` response.
- The student report controller selects `Report.adminReviewNote`.
- Read-only database introspection of the backend's configured PostgreSQL database found no `Report.adminReviewNote` column.
- Prisma reports all six historical migrations pending, while the configured database already contains some objects created by those migrations. Do not run a blanket `prisma migrate deploy` or `prisma db push` as a shortcut; that can conflict with the existing schema and affect unrelated tables.

## Implementation

- Repair only the missing nullable `Report.adminReviewNote` column using the existing `20261006000000_add_report_review_note` migration definition.
- Inspect the database immediately before applying the change. Apply the additive SQL only if the column is still absent; do not alter or remove existing data.
- Recheck the column and exercise the authenticated reports query after repair. Do not expose credentials, tokens, or report contents in logs/output.
- Keep the application controller/API contract unchanged unless the report query still fails after the schema repair; if it does, inspect the backend error and correct the actual root cause rather than masking it.
- Do not run unrelated pending migrations, use `db push`, or change the migration history for unrelated migrations. Report any migration-history limitation clearly.

## Validation

- Confirm the report endpoint no longer returns HTTP 500 for the signed-in student.
- Run the focused backend student-report tests and backend type-check.
- Run `git diff --check`.
- Preserve unrelated worktree changes and do not commit.
