# Extend the student sidebar identity area

Update `frontend/components/app-shell.tsx` so the student sidebar identity area (Abode,
the signed-in user's name, and Student role) is taller and extends through the space
currently occupied by the Find Homes link.

- Place Dashboard below the expanded identity area; keep Find Homes below Dashboard.
- Apply the layout to the desktop sidebar and the mobile drawer so the identity area's
  expanded height and the navigation order are consistent.
- Preserve the identity text, existing student link order after Find Homes, mobile
  close/menu behavior, landlord/admin navigation, Sign out, footer, and styling.

Verify the desktop and mobile student sidebar positions and ensure there is no horizontal
overflow. Run frontend TypeScript and targeted ESLint checks.
