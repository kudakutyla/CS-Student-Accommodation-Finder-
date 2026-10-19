# Move student navigation below the identity area

Update `frontend/components/app-shell.tsx` for the student sidebar:

- Keep the desktop identity block (Abode, the signed-in user's name, and Student role)
  visually occupying the full existing top section through the current Find Homes row.
- Move Dashboard and Find Homes out of that identity section. Start Dashboard at the
  position where Saved Homes currently begins, then place Find Homes below Dashboard,
  preserving the existing order of the remaining student links.
- Keep the mobile drawer usable and retain its current identity header and navigation
  behavior.
- Preserve landlord and admin navigation, active states, account controls, Sign out,
  attribution footer, and all existing colors.

Verify desktop alignment and the mobile student drawer. Run frontend TypeScript and
targeted ESLint checks.
