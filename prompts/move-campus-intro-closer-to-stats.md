# Move campus intro directly below homepage stats

## Objective

Reduce the vertical gap between the three-stat card and the "Start close to
campus" campus-discovery section on the homepage.

## Implementation

- Adjust only the top spacing on the campus-discovery section in
  `frontend/app/page.tsx` so its eyebrow follows the stats card closely on mobile
  and desktop.
- Preserve the section's existing content, horizontal spacing, bottom spacing,
  responsive layout, and campus cards.

## Verification

- Run the frontend TypeScript check.
- Verify the "Start close to campus" eyebrow appears closer under the stats card
  in the browser at mobile width.
