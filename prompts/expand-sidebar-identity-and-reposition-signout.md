# Expand sidebar identity header and reposition sign out

Update `frontend/components/app-shell.tsx` for the signed-in sidebar:

- Replace the “Student portal”/role subtitle in both the sidebar header and mobile
  slide-out header with the logged-in user's name and role (for example, “Kudakwashe
  Chifamba” and “Student”). Use the authenticated user data and existing role labels;
  do not hardcode a person or role.
- On desktop, increase the sidebar brand/header area's vertical size so its bottom aligns
  with the bottom of the “Find Homes” navigation item. Preserve the existing nav order and
  item spacing. Keep the mobile top bar usable and do not cause content overflow.
- Separate the account identity block from the Sign out action. Place Sign out in its own
  row immediately above the deep-brown copyright/attribution footer, leaving the account
  identity above it. Keep logout behavior unchanged.

Preserve role-specific navigation, active states, footer attribution and colors, and admin/
landlord behavior. Verify student, landlord, and admin identities, desktop header alignment,
and mobile sidebar scrolling. Run frontend TypeScript and targeted ESLint checks.
