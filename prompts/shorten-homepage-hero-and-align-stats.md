# Shorten the homepage hero and align stats

## Objective

End the landing hero image directly beneath the "Find your place. Stay closer."
heading, move the supporting sentence below the image, and show the three homepage
statistics in one horizontal row.

## Implementation

- Update `frontend/app/page.tsx` so the hero's image-backed section is sized to
  its content rather than a viewport-height minimum, with compact responsive
  spacing and no empty image area below the heading.
- Keep the existing eyebrow and heading over the image; place the existing
  supporting sentence immediately below the hero on the warm-white background.
- Keep the campus-community and featured-home values data-backed.
- Render campus communities, featured homes, and the focused-on-student-living
  statistic in one three-column horizontal row on mobile and desktop, with
  readable wrapping for the longer label.
- Preserve the existing campus cards, featured listings, navigation, and API
  loading/error behavior.

## Verification

- Run the frontend TypeScript check.
- Verify at mobile width that the hero ends below the heading, the supporting
  sentence and remaining sections appear immediately below it, and the stats
  form a single horizontal row.
- Verify the desktop layout remains balanced.
