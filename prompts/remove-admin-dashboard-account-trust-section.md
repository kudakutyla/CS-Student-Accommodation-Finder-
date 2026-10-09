# Remove the admin dashboard account trust section

## Goal

Remove the “Account trust” / “Students and landlords” section from the admin
dashboard, as requested.

## Implementation

- Remove only the account trust section and its account-management controls from
  the admin dashboard.
- Preserve the platform statistics, dashboard loading and error states,
  navigation, and their existing behavior.
- Avoid unrelated changes.

## Validation

- Run focused frontend lint and TypeScript checks for the admin dashboard.
- Run `git diff --check`.
- Verify in the browser that the section is gone while the statistics remain.
