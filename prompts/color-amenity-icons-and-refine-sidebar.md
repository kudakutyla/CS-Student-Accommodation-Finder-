# Add colored amenity icons and refine sidebar layout

Make the following focused UI updates:

- In `frontend/app/listings/[id]/listing-detail.tsx`, show a colored Lucide icon beside
  each displayed amenity, including common amenities entered by landlords (Wi-Fi/internet,
  laundry, study area, parking, and security). Provide a colored generic fallback icon for
  custom amenity labels so none render without an icon. Keep the amenity text and existing
  data unchanged.
- In `frontend/components/app-shell.tsx`, increase navigation link font size and icon size
  consistently across roles while retaining active/hover styling.
- Keep Sign out in its own row pinned directly above the sidebar attribution footer at
  desktop and mobile sizes. Make the sidebar navigation area flex to fill available height
  so this placement holds in the mobile drawer too. Preserve the existing logout action,
  footer, identity header, role-specific colors, and menu behavior.

Verify listing detail common and custom amenity rendering, sidebar text/icon sizing, and
Sign out position above the footer on desktop and mobile without horizontal overflow. Run
frontend TypeScript and targeted ESLint checks for the changed components.
