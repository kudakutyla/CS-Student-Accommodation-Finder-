# Admin listing results and status reconciliation

## Problem

The admin dashboard reports 8 total listings, 7 approved, and 0 pending. The
remaining listing is not explained because the dashboard does not report draft
or rejected counts, and the Listings and Approved listings metrics are not
navigable to result lists.

## Implementation

1. Trace the existing listing-status model, admin API routes, listing response
   type, and dashboard statistic queries before editing.
2. Keep the total count defined as all listing records. Add accurate draft and
   rejected counts to the admin stats response and dashboard so listing totals
   reconcile across `DRAFT`, `PENDING`, `APPROVED`, and `REJECTED`.
3. Make the **Listings** dashboard statistic open an admin-only directory of all
   listings. Make **Approved listings** open the same directory filtered to
   `APPROVED`. Keep **Pending listings** opening its existing moderation queue.
4. Add a server-side admin listings endpoint that supports an optional validated
   approval-status filter and returns the listing fields needed for an admin
   result list, including status, owner/provider, campus, and rejection reason
   where present. Protect it with the existing authentication and admin
   authorization middleware. Do not weaken public listing visibility rules.
5. Build a results page that clearly labels each listing's status so drafts and
   rejected listings are discoverable, displays approved results when filtered,
   and handles loading, empty, and API-error states explicitly. Preserve links to
   listing details and the existing pending moderation workflow.
6. Add or extend focused tests for each status count, optional filter behavior,
   invalid filters, and admin-only access. Preserve unrelated worktree changes.

## Validation

- Confirm total listings equals the sum of draft, pending, approved, and
  rejected counts for fixtures covering all statuses.
- Confirm dashboard navigation opens all listings and approved listings
  separately, while Pending listings still opens the existing queue.
- Confirm each listing result shows its correct status and filtered views return
  only the requested status.
- Run focused backend tests, backend type-check, frontend lint/build, and
  `git diff --check`.
