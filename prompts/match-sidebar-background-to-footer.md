# Match sidebar attribution strip to footer

Update only the bottom attribution strip in the signed-in sidebar in
`frontend/components/app-shell.tsx` to use the same deep-brown background as the global
landing-page footer (`var(--brown-dark)`). Apply it for student, landlord, and admin roles.

Adjust the copyright and map-attribution text and its divider to warm light colors with
clear contrast. Keep the OpenStreetMap link readable and visibly interactive. Preserve the
rest of the sidebar, including navigation and account controls. Do not change the global
landing-page footer.

Verify the bottom attribution strip colors and contrast in mobile and desktop sidebars for
all three roles. Run frontend TypeScript and targeted ESLint checks.
