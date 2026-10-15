# Fix report submission against the current database schema

## Verified cause

The database's `Report` table does not yet contain the nullable
`adminReviewNote` column declared in the current Prisma schema. The migration
that adds it is still pending. Prisma's default `report.create()` response
selects every scalar field, including that absent column, so saving a report
fails even though the insertable report fields exist.

## Implementation

- Give the report creation query an explicit selection of the existing report
  fields needed in its response, excluding `adminReviewNote`.
- Keep report persistence and admin notification handling separate as they
  currently are; preserve validation, authorization, approved-listing checks,
  and success/error messages.
- Update the focused controller test to assert the explicit selection.
- Do not apply pending migrations: multiple migrations are unapplied and the
  database already contains tables from those changes, so bulk migration could
  fail or affect shared data.

## Validation

- Run focused report-submission tests and backend TypeScript build.
- Run `git diff --check`.
- Do not create live reports or modify the shared database.
