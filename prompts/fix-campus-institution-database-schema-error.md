# Fix Campus and Institution API Failures

Resolve the campus/institution API errors that make the homepage show
"Campus and institution filters are temporarily unavailable."

## Findings to verify

- `GET /api/campuses/institutions` and `GET /api/campuses` currently return
  HTTP 500, while approved listing search succeeds.
- Prisma's current `Institution` model includes nullable `logoUrl`, introduced
  in `20261015000000_add_institution_logo_url`. Institution queries return
  this field implicitly or through `institution: true`, so a database without
  that column will fail.
- `prisma migrate status` previously reported five migrations pending on the
  configured Neon database. The repository release instructions say there is
  no reviewed production migration baseline. A pending migration status alone
  does not prove whether the underlying schema changes are absent or already
  present.

Confirm the exact runtime/database error using available application logs and
safe, read-only inspection. Do not print, copy, or expose database URLs or
other secrets.

## Required work

- Trace the failing public campus and institution endpoints and determine the
  precise Prisma/database error; do not assume `logoUrl` is the only mismatch.
- Restore the endpoints against the actual intended schema without changing
  frontend behavior, public listing visibility, or campus/institution data.
- Keep institution logos available whenever the database schema supports them.
  Do not permanently remove `logoUrl` from API responses or silently return
  successful empty data to hide database failures.
- Add or update focused backend tests for the affected endpoint behavior and
  document exact verification steps.
- Update directly related release/migration documentation if the verified
  recovery procedure is clarified.

## Database safety constraints

- Treat the configured Neon database as potentially production.
- Do not run `prisma migrate deploy`, `prisma migrate dev`, `prisma db push`,
  seed scripts, ad hoc DDL, or any command that writes to the configured
  database during implementation.
- Do not mark migrations applied or create a baseline until read-only schema
  inspection verifies that every operation in the proposed baseline is already
  represented in that database.
- If the exact failure cannot be fixed safely in code and requires database
  changes, stop before making them. Provide the verified schema discrepancy,
  the smallest reviewed migration/baseline action, and the safe verification
  and backup steps; ask for explicit database-environment and change approval.
- Do not weaken error reporting or introduce a schema-drift fallback that
  hides unrelated database errors.

## Validation

- Run the focused backend endpoint tests, relevant type-check/build, and
  `git diff --check`.
- Verify the frontend-facing API response shape and ensure successful results
  still include institution logos when supported by the schema.
- Do not claim the live/deployed endpoints are restored unless they are
  verified against the intended database and deployment.
