# Remove Explore Abode from the signed-in sidebar

Remove the “Explore Abode” navigation section and its About Abode, Safety & reporting,
Privacy notice, Terms of use, and Share Abode links from `frontend/components/app-shell.tsx`.
Keep the role-specific navigation, account/sign-out controls, mobile slide-out behavior,
and deep-brown copyright/map attribution strip unchanged. Do not remove the public footer
links or their destinations elsewhere in the app.

Run frontend TypeScript and targeted ESLint checks, then verify the Explore Abode section
is absent from the signed-in mobile sidebar while the attribution strip remains present.
