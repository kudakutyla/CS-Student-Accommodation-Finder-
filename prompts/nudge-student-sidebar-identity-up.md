# Nudge student name and role upward

In `frontend/components/app-shell.tsx`, move the student name and role slightly upward
within the existing identity area on desktop and in the mobile drawer.

- Preserve the Abode wordmark position and existing identity-area height/boundary.
- Keep Dashboard and Find Homes positions unchanged.
- Leave landlord/admin layouts and Sign out/footer placement unchanged.

Verify the name/role move upward on mobile and desktop without causing overflow. Run
frontend TypeScript and targeted ESLint checks.
