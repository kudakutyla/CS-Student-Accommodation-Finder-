# Make admin dashboard statistic cards navigable

## Goal

Make all seven statistic cards on the Admin dashboard open a page showing the
matching records:

- Students → student accounts
- Landlords → landlord accounts
- Verified landlords → verified landlord accounts
- Listings → all listings
- Pending listings → pending listings
- Approved listings → approved listings
- Active campuses → active campus records

## Implementation

- Turn loaded statistic tiles in `frontend/app/admin/dashboard/page.tsx` into
  accessible links while preserving their current labels, values, and layout.
- Add an admin-only results page driven by a validated `type` query parameter;
  display matching account, listing, or campus records and a clear page title.
- Keep student/landlord filtering based on the existing safe admin users
  endpoint. Use the existing campus management endpoint for active campuses.
- Add a backend admin listings endpoint for `ALL`, `PENDING`, and `APPROVED`
  statuses. Validate query input and return only the listing fields/relations
  needed by the results view. Keep authorization under the existing admin-only
  router guard.
- Add API client methods/types and focused backend tests for listing status
  filtering/validation. Keep existing pending-listing moderation page and
  behavior unchanged.
- Provide loading, empty, and explicit error/retry states in the results page.
- Do not change statistics calculations, dashboard account controls, or
  non-admin routes.

## Validation

- Run focused backend admin-listing tests and backend TypeScript check.
- Run frontend lint for modified/new dashboard/results files and frontend
  TypeScript check.
- Run `git diff --check`.
- Verify each dashboard card links to the correct results type, including
  filtered listing status and active campus results.
