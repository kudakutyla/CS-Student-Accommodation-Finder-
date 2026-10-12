# Keep authenticated navigation out of the page header

## Problem

The public `Navbar` contains the Student Accommodation badge, discovery link,
saved homes, messages, updates, profile, and sign-out controls. These belong in
the role-aware portal navigation, not in a page header for a signed-in user.
During authentication initialization, `AppShell` can temporarily render this
public navbar before the stored session has been resolved.

## Implementation

1. Keep the existing role-specific destinations and user/sign-out controls in
   `AppShell`'s portal navigation.
2. While authentication is still loading, do not render the public `Navbar` on
   any route. Render the page content or a suitable neutral loading state until
   the session resolves.
3. After authentication resolves, render the portal shell for signed-in users
   and the public `Navbar` only for signed-out users. Ensure no authenticated
   route renders the public navigation header.
4. Preserve the existing mobile hamburger drawer, desktop/tablet sidebar,
   public signed-out login/register navigation, and page content.
5. Preserve all unrelated worktree changes.

## Verification

- Run the frontend TypeScript check, targeted lint, and production build.
- Verify the shared shell's auth-loading branch cannot render `Navbar`, and
  signed-out users still receive public login/register navigation.
- If a browser session is available, check signed-in and signed-out routes at
  mobile and desktop widths; confirm authenticated links/profile/sign-out are
  available only from portal navigation.

## Acceptance criteria

- No signed-in page shows the public navigation header or its links/actions.
- Signed-in role navigation remains accessible from the hamburger drawer on
  mobile and through the sidebar on larger screens.
- Signed-out users retain the public navbar and login/register actions.
