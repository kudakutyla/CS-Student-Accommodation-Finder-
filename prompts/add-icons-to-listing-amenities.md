# Add Icons to Listing Amenities

Add a clear, accessible icon immediately next to each amenity label on the
student-facing listing detail page, matching the supplied screenshot's amenity
chip layout.

## Scope

- Update `frontend/app/listings/[id]/listing-detail.tsx`, where `listing.amenities`
  are currently rendered as plain text chips.
- Use the existing `lucide-react` dependency and established icon import style.
- Map the requested amenity labels to recognizable icons:
  - WiFi — wireless/network icon.
  - Security — shield or shield-check icon.
  - Water Tank — water/droplet icon.
  - Study Desk — book or desk-appropriate icon.
  - Prepaid Electricity — lightning/bolt icon.
- Keep each amenity's existing wording and layout; render unknown/future amenity
  strings as text without inventing an icon.
- Keep icons decorative (`aria-hidden`) because the adjacent visible label
  supplies the accessible name. Align icon and text with a small consistent gap.
- Do not change listing data, amenity selection, or other listing-detail behavior.

## Validation

- Run targeted frontend ESLint, TypeScript checking or production build, and
  `git diff --check`.
- Verify all five requested amenities show the appropriate icon next to their
  labels and that unknown amenity text still renders.
