# Compact the student dashboard card and add sidebar attribution

Update the student dashboard card in `frontend/app/student/dashboard/page.tsx`:

- Reduce its padding and vertical spacing so the main card ends immediately after its
  Search homes and Saved homes actions.
- Place those two actions side by side on mobile and wider screens.
- Move the “Verified listings”, “Near campus”, and “Secure options” badges below the card
  in one horizontal row, allowing a controlled wrap only at narrow widths if required.

Update `frontend/components/app-shell.tsx` so the signed-in sidebar puts the account
controls above a compact, bottom-pinned attribution block containing:
“© [current year] Abode. All rights reserved.” and
“Geographic data © OpenStreetMap contributors · Routing by OSRM”.
Keep the global public-site footer and its attribution intact. Preserve role navigation,
sidebar links, and mobile menu scrolling; ensure readable contrast in light and dark
sidebars.

Verify at a 390px mobile viewport and desktop width: dashboard card ends after the
horizontal actions, benefit badges are in a row without horizontal overflow, and sidebar
attribution is visible at its bottom. Run frontend TypeScript and targeted ESLint checks.
