# Admin dashboard result navigation

## Goal

Make the admin dashboard statistics useful entry points to their corresponding
result pages, and remove the redundant account-trust list from the dashboard.

## Requirements

1. Make the **Students** statistic open the admin user directory filtered to
   `STUDENT`.
2. Make **Landlords** open the directory filtered to `LANDLORD`, and **Verified
   landlords** open it filtered to verified landlords only.
3. Keep **Pending listings** opening the existing pending-listings queue.
4. Remove the dashboard's combined **Account trust / Students and landlords**
   section and its embedded account-management results/actions. Account
   management should live in the user directory, not be duplicated beneath the
   dashboard statistics.
5. Keep the user directory admin-only. Ensure the role/verification filters are
   applied by the API, and that loading, empty, and request-error states remain
   explicit. Preserve verification and activation actions in that directory.
6. Retain keyboard-accessible and visibly interactive metric links and preserve
   other dashboard metrics and navigation behavior.
7. Inspect existing worktree changes first and preserve unrelated user changes;
   do not overwrite or revert them.

## Validation

- Verify the three account-statistic links open their correct filtered lists.
- Verify the pending-listings statistic opens its existing queue.
- Verify non-admin users remain blocked from the account directory and the API.
- Run focused relevant tests, frontend type/lint/build checks available in the
  repository, and `git diff --check`.
