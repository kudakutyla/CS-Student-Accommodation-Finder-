# Update footer to a complementary brown background

Change only the global footer styling in `frontend/app/layout.tsx` so the footer has a
warm, deep brown background that fits Abode's existing cream, beige, and brown palette.

Use the existing `--brown-dark` token (`#5c4a38`) for the background rather than adding a
new color. Adjust the footer text, brand, navigation headings, and links to warm light
colors with sufficient contrast; make hover states remain clear and keep the divider
subtle against the brown surface. Preserve all footer content, destinations, responsive
layout, and OpenStreetMap/OSRM attribution. Do not change page backgrounds or unrelated
styles.

Validate with the frontend TypeScript and targeted ESLint checks, and inspect the footer
at desktop and mobile widths for readable contrast and overflow.
