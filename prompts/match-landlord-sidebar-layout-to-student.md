# Match landlord sidebar layout to student sidebar

Update the role-aware sidebar in `frontend/components/app-shell.tsx` so the
landlord sidebar uses the same identity/header and navigation layout as the
student dashboard sidebar on desktop and mobile:

- Use the student sidebar's larger Abode wordmark, signed-in user name and role
  typography, spacing, and charcoal text in the landlord identity block.
- Place the landlord's full navigation list below the identity block, as the
  student list is, rather than placing the first two landlord links inside the
  compact identity/header block.
- Use the same navigation text size, icon size, item height, and spacing as
  the student sidebar, while keeping landlord navigation labels, destinations,
  ordering, and active highlighting intact.
- Mirror the larger identity treatment in the mobile slide-out sidebar as well;
  retain the verified-provider badge where applicable.

Keep the student and administrator sidebars, footer, theme controls, responsive
behavior, and sign-out behavior unchanged. Do not modify page content or role
permissions.

Run frontend lint and TypeScript validation.
