# Color Listing Amenity Icons

Apply distinct, accessible colors to the icons beside amenity labels on
`frontend/app/listings/[id]/listing-detail.tsx`, preserving the current icon
choices, amenity text, and chip layout.

- Use colors that fit the existing Abode palette and retain sufficient contrast
  against the cream chip background.
- Give WiFi, security, water tank, study desk, and prepaid electricity
  distinguishable semantic colors without changing the text color.
- Keep the icons decorative with `aria-hidden`.
- Do not alter amenity data or any other listing detail behavior.

Validate with targeted frontend ESLint, TypeScript checking or build, and
`git diff --check`.
