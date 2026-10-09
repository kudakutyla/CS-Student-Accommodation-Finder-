# Fix admin reports not loading

## Problem

The admin reports page shows “Failed to fetch reports”. Local backend logs
identify Prisma error `P2022`: the current database does not have
`Report.adminReviewNote`, although the Prisma schema includes it. The migration
that adds the column is pending, and local `.env` points to a Neon database.
Do not apply migrations or otherwise mutate that external database as part of
this fix.

## Goal

Allow the admin reports page to load existing reports when the connected
database is behind on the optional admin review-note column.

## Implementation

1. Keep the admin authorization and current `{ success, data, message, errors }`
   response contract unchanged.
2. In `getAdminReports`, replace the broad `include`/all-scalar selection with
   an explicit Prisma `select` for the report fields the page displays:
   `id`, `reason`, `description`, `status`, `createdAt`, `listing.id`,
   `listing.title`, `listing.approvalStatus`, `user.id`, `user.name`, and
   `user.email`.
3. Do not select or otherwise read `adminReviewNote` in the list query. Preserve
   ascending creation-time ordering.
4. Add a focused controller test that asserts the query selects only the
   supported/displayed report fields and that the projected report data is
   returned successfully. Use the repository's existing Jest patterns.
5. Do not edit, discard, or hide user changes. Do not run `prisma migrate`,
   `db push`, or any operation that mutates the configured Neon database.
6. State in the completion summary that the separate `add_report_review_note`
   migration is still required for admin review notes to persist during status
   updates; this fix is specifically for making reports visible.

## Validation

- Run the focused report controller test and backend type-check/build.
- Verify `GET /api/admin/reports` no longer reads the missing column.
- Verify the admin UI no longer presents the false empty-state alongside an
  API error; request failures must remain explicit.
- Run `git diff --check`.
