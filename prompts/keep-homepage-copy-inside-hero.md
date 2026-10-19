# Keep homepage intro copy inside hero

## Objective

Make the image-backed homepage hero tall enough to comfortably contain the
eyebrow, heading, and supporting sentence, then show the three homepage stats
directly below the hero.

## Implementation

- In `frontend/app/page.tsx`, move the existing supporting sentence into the
  image-backed hero alongside the eyebrow and heading.
- Give the hero responsive vertical sizing and spacing so the complete intro
  fills the image card without clipping or leaving an oversized empty area.
- Keep the stats in a separate section immediately below the hero, in a
  horizontal three-column row on mobile and desktop.
- Preserve the current campus and listing data loading, error messages, and
  content sections.

## Verification

- Run the frontend TypeScript check.
- Verify at mobile width that all three intro text elements are inside the hero
  image and that all three stats are in one row beneath it.
- Verify the desktop layout remains balanced.
