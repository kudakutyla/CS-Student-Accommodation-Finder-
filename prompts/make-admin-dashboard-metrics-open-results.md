# Make admin dashboard metrics open result lists

## Problem

The admin dashboard must let administrators click **Students**, **Landlords**,
and **Verified landlords** to open the matching result list, in the same direct
way that **Pending listings** opens its queue. Those metric anchors currently
have minimal styling, so they may not be apparent as interactive dashboard
cards.

## Implementation

1. Inspect the dashboard metric links, `/admin/users` page, admin API filtering,
   and role-protected backend endpoint before editing.
2. Make the entire Students, Landlords, and Verified landlords metric card
   visibly and accessibly clickable. Keep its existing count and route it to
   `/admin/users?role=STUDENT`, `/admin/users?role=LANDLORD`, or
   `/admin/users?role=LANDLORD&verified=true`, respectively.
3. Ensure the result page loads and labels the matching filtered list, including
   loading, empty, and API error states. Keep user verification and activation
   actions working.
4. Keep Pending listings linked to `/admin/pending-listings`; do not change its
   behavior or make non-admin access possible.
5. Preserve unrelated worktree changes.

## Verification

- Add or extend focused tests for the three dashboard destinations and the
  corresponding user filters if there is an established runner.
- Run frontend TypeScript, lint, and production build.
- Run focused backend admin filter tests and backend type-check.
- Run `git diff --check`.

## Acceptance criteria

- Clicking anywhere on each of the Students, Landlords, and Verified landlords
  dashboard cards opens the appropriate result list.
- Each result list shows only its requested role/verification state.
- Pending listings continues opening its existing queue.
- Cards communicate clickability, support keyboard navigation, and remain
  usable responsively.
