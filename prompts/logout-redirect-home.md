# Logout Redirect to Home

## Objective
After logout, redirect the user to the public landing page (`/`) from both role-portal navigation and the public navbar.

## Scope
- Update only the post-logout route in `frontend/components/app-shell.tsx` and `frontend/components/Navbar.tsx`.
- Preserve the shared `logout()` behavior, including clearing local auth state if the API logout request fails.
- Do not change role authorization, auth persistence, or navigation links.

## Validation
- Run frontend TypeScript and lint checks.
- Use the browser to log out from a role portal and verify the URL is `/` and the public landing page appears.
