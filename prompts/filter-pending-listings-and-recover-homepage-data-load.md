# Filter Pending Listings and Fix the Homepage Data Error

Implement the pending-listing moderation filters and fix the homepage's generic
live-data failure without discarding existing worktree changes.

## Pending listings

- Add a residence search field to `/admin/pending-listings`. Match
  case-insensitively against listing title, address, campus, and landlord name.
- Add submitted-date filters using the listing's existing `createdAt` value.
  Support inclusive start and end dates; handle date-only input consistently
  with the browser's local calendar date.
- Keep filtering responsive, show a useful empty state when no listings match,
  and preserve existing approve/reject, refresh, error, and loading behavior.
- Do not change public listing visibility or moderation authorization.

## Homepage live-data failure

Investigation found that the homepage loads institutions, campuses, and
approved listings in one `Promise.all`, so an institution/campus API failure
hides all homepage live data. In the current local environment, the listing
search endpoint returns HTTP 200, while `/api/campuses/institutions` and
`/api/campuses` return HTTP 500. Prisma reports that all five repository
migrations are pending on the configured Neon database, including the new
`Institution.logoUrl` migration. The migration history is not baselined, so
blindly running `prisma migrate deploy`, `prisma migrate dev`, or `db push`
could be unsafe.

- Make homepage loading resilient: load and display successful approved
  listings independently from campus/institution lookups. Do not show the
  current whole-page "Live accommodation data is temporarily unavailable"
  message merely because a secondary campus selector request fails.
- Surface a specific, actionable catalog error for institution/campus selector
  failures, with a retry path. Keep listing-search errors explicit and
  distinguishable.
- Inspect backend failures and add a narrowly scoped compatibility fix only if
  it can preserve existing database behavior without masking unrelated Prisma
  errors. Do not silently swallow errors or expose database details.
- Do not apply any migration, run DDL, or alter the configured Neon database
  during implementation. Preserve the migration and explain the required safe
  database action separately. Do not claim campus selectors or institution
  logos are fully restored until their schema is present.

## Validation

- Add tests for pending search and inclusive date filtering, and for homepage
  partial-success/error behavior if the existing test setup supports it.
- Run relevant backend/frontend tests, targeted lint, type-check/build, and
  `git diff --check`.
- Verify pending listings remain admin-only and public listing results remain
  approved-only.
