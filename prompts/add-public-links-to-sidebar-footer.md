# Add public footer links to the portal sidebar

Update `frontend/components/app-shell.tsx` so the signed-in student, landlord, and admin
sidebar includes a compact “Explore Abode” footer section above the signed-in user profile.
Include links to About (`/about`), Safety & reporting (`/safety`), Privacy notice (`/privacy`),
Terms of use (`/terms`), and Share Abode (`/share`), matching the current footer link labels
where practical.

Keep the existing role-specific navigation and profile/sign-out controls intact. Style the
additional links to suit both the warm-white student/landlord sidebar and the dark admin
sidebar. Ensure the mobile slide-out menu can scroll if its navigation and footer exceed
the viewport, and close it when a footer link is chosen.

Verify all links work from each signed-in role, the mobile sidebar remains usable without
horizontal overflow, and run frontend TypeScript and targeted ESLint checks.
