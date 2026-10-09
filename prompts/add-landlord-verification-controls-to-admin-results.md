# Add landlord verification controls to admin results

## Goal

Give admins a clear place to verify landlords now that account management is no
longer shown on the admin dashboard.

## Implementation

- Add an admin-only `Verify landlord` action to unverified landlord rows on
  `/admin/results?type=landlords`.
- For verified landlords, show `Revoke verification` to preserve the existing
  administrative action.
- On success, update the displayed landlord verification state without
  reloading the entire page. Disable the relevant action while the request is in
  progress.
- Surface API failures explicitly in the results page.
- Do not add student account actions, deactivate controls, or change dashboard
  content.
- Reuse the existing admin API and backend authorization.

## Validation

- Run focused frontend lint and TypeScript checks for the admin results page.
- Verify landlord actions in the browser without changing shared account data
  unless explicitly requested.
- Run `git diff --check`.
