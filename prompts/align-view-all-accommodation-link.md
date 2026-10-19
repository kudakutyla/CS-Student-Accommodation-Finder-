# Align and underline the campus section link

## Objective

Place "View all accommodation" on the right side of the campus section heading,
aligned beside the heading's final line, and underline the link by default.

## Implementation

- Update the campus section header in `frontend/app/page.tsx` to keep the heading
  and action link on one horizontal row at mobile and desktop widths.
- Use responsive spacing and heading sizing as needed to avoid crowding or
  horizontal overflow on narrow screens.
- Align the action link to the heading's bottom line and apply a visible text
  underline by default.
- Preserve destinations, content, colors, and the following campus cards.

## Verification

- Run the frontend TypeScript check.
- Verify the link appears underlined at the right of the campus heading on mobile
  and desktop, without horizontal overflow.
