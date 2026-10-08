# Fix admin reports fetch failure

## Problem

The live admin reports page loads `/api/admin/reports`, but the API returns
HTTP 500 with `Failed to fetch reports`. The report handler catches the
underlying Prisma/database error and logs it, so diagnose the actual deployed
failure before changing behavior.

## Implementation

1. Inspect the report controller, admin report route mounting, Prisma Report
   model, committed migrations, database deployment workflow, and existing
   report tests. Preserve unrelated worktree changes.
2. Use the backend deployment logs or a safely reproduced isolated database
   failure to identify the exact root cause. Do not infer it solely from the
   generic client error.
3. Fix the root cause with the smallest complete change. If production database
   schema drift is confirmed, provide a reviewed non-destructive migration and
   explicit safe rollout instructions. Do not run `prisma db push`, reset,
   seed, or unreviewed migrations against production.
4. Keep report listing, linked listing/user fields, authorization, status
   updates, audit logging, and student notifications working. Report errors
   explicitly; do not return an empty successful result on database failure.
5. Add or extend focused automated tests for the root cause and admin reports
   retrieval, including the expected selected relations/fields and failure
   behavior.
6. Deploy only the scoped report fix after checks pass, keeping all unrelated
   user changes out of the commit. Verify the live API and admin reports page.

## Validation

- Confirm an admin can load reports and receives the expected listing/user
  context.
- Confirm a database/request failure remains an explicit error and is logged
  server-side without leaking database details to the browser.
- Run focused report tests, backend type-check, and `git diff --check`.
- If deployment/database access prevents safe live verification, state the
  remaining operator action precisely; never expose credentials or ask for
  secrets in chat.
