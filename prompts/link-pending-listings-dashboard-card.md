# Link the Pending Listings dashboard card to moderation

## Goal

Make the Admin Dashboard “Pending listings” metric card open the existing
Pending Listings moderation page.

## Existing behavior

The metric currently links to `/admin/results?type=pending-listings`. The
dedicated moderation page already exists at `/admin/pending-listings` and
provides Approve and Reject actions.

## Implementation

- Change only the Pending listings metric card href in
  `frontend/app/admin/dashboard/page.tsx` to `/admin/pending-listings`.
- Keep the pending count, card layout, accessible label, and all other metric
  destinations unchanged.
- Do not modify the existing results page or moderation page.

## Validation

- Run frontend TypeScript and targeted lint checks.
- Confirm the Pending listings card navigates to `/admin/pending-listings`
  and the existing page renders its moderation view.
- Run `git diff --check` for the changed file.
