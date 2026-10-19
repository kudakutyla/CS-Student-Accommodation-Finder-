# Align featured homes link with heading's last line

## Objective

On mobile, align the underlined "Explore the full collection" link at the far
right opposite the final "at" line of "Homes worth looking at".

## Implementation

- Update only the featured-homes section header in `frontend/app/page.tsx`.
- At mobile widths, place "at" on a second heading line and align the
  underlined link to the right on that same line.
- Preserve the current heading/link side-by-side arrangement on desktop.
- Keep the featured-home cards and other section spacing/content unchanged.
- Ensure the mobile header does not overlap or create horizontal overflow.

## Verification

- Run the frontend TypeScript check.
- Verify at 390px that the link is underlined and aligned opposite "at", with no
  overlap or horizontal overflow.
- Verify the desktop header remains side-by-side.
