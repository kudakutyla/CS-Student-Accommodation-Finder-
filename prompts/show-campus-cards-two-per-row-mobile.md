# Show campus cards two per row on mobile

## Objective

Display campus cards in a two-column grid below "Explore where you could live"
at mobile widths.

## Implementation

- Update the campus-card grid in `frontend/app/page.tsx` to use two columns at
  mobile widths.
- Preserve the existing two-column tablet and four-column desktop layouts, card
  content, links, and spacing as much as possible.
- Ensure card text remains readable and the page does not overflow horizontally
  on a 390px-wide viewport.

## Verification

- Run the frontend TypeScript check.
- Verify the campus card grid has two columns on mobile and remains four columns
  on desktop.
