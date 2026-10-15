# Mobile Hamburger Sidebar

## Objective
Replace the always-visible horizontal role navigation on narrow viewports with an accessible hamburger toggle, while preserving the existing desktop sidebar and all role-specific links.

## Scope
- Edit only `frontend/components/app-shell.tsx` unless a validation failure requires a directly related fix.
- On mobile, keep the Abode brand and current landlord verification indicator in a compact header with a Menu/Close button.
- The toggle opens and closes the current role's navigation and account/sign-out area.
- Use `aria-expanded`, `aria-controls`, an accessible label, and a keyboard-operable native button.
- Close the menu when a role navigation link is selected.
- At the desktop breakpoint, show the existing full-height role sidebar and do not show the hamburger toggle.
- Preserve student/landlord/admin separation, active-link behavior, authentication, routes, and sign-out semantics.

## Validation
- Run the frontend TypeScript check, lint, and production build.
- Use the browser at a narrow mobile width to verify the menu starts closed, toggles open/closed, each role link is reachable, and navigation closes the menu.
- Verify desktop still displays the persistent sidebar with no hamburger.
