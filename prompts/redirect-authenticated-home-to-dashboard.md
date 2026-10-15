# Redirect signed-in users to their dashboards

## Goal

When an authenticated user opens the site landing page (`/`), send them to the
dashboard for their role:

- Student → `/student/dashboard`
- Landlord → `/landlord/dashboard`
- Admin → `/admin/dashboard`

## Implementation

- Add the role-aware redirect to `frontend/app/page.tsx`, waiting until auth
  restoration completes before routing.
- Preserve the existing login and registration behavior: after successful
  authentication, honor a safe explicit requested-page redirect; otherwise
  route to the correct role dashboard.
- Avoid rendering the public landing content for an already authenticated
  user while the redirect is being applied.
- Do not change role authorization, route guards, or dashboard content.

## Validation

- Run frontend lint for the landing page.
- Run the frontend TypeScript check.
- Run `git diff --check`.
- Verify signed-in users of each role are routed to the correct dashboard and
  unauthenticated visitors still see the public landing page.
