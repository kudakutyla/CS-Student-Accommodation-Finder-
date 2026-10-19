# Remove the repeated sidebar profile row

Update `frontend/components/app-shell.tsx` to remove the account identity row that
currently appears below the Profile navigation link. This is the avatar/profile image,
user name, and role repeated near the bottom of the sidebar.

Keep the authenticated user's name and role in the sidebar identity header. Preserve
navigation, Sign out placement and behavior, footer attribution, and existing role-specific
appearance. Remove any imports that are no longer needed.

Verify the mobile sidebar no longer shows the repeated identity row, while Sign out and
the attribution footer remain visible. Run frontend TypeScript and targeted ESLint checks.
