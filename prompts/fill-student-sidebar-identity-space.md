# Fill the student sidebar identity area

Update the student identity layout in `frontend/components/app-shell.tsx`:

- Increase the Abode wordmark size so it is the prominent top element in the expanded
  identity area.
- Move the signed-in user's name and Student role down within that area, enlarge both,
  and distribute the identity content vertically to use the otherwise empty space.
- Keep the existing identity-area boundary and the Dashboard/Find Homes navigation
  starting positions unchanged.
- Apply consistent spacing in the mobile drawer and desktop sidebar without changing
  landlord/admin layouts, sidebar navigation, Sign out, or footer behavior.

Verify the student identity layout at desktop and mobile widths, confirm navigation still
starts at the same boundary, and run frontend TypeScript and targeted ESLint checks.
