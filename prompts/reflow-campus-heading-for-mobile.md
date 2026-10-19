# Reflow the campus heading on mobile

## Objective

At mobile widths, show "Explore where you could" on the first heading line and
"live" on the second, with "View all accommodation" aligned on the right
opposite "live".

## Implementation

- Update only the campus-discovery section header in `frontend/app/page.tsx`.
- At mobile widths, let the heading use the available section width and place
  "live" on its own second line.
- Align the existing "View all accommodation" link at the right of the second
  line, opposite "live", and keep it visibly underlined.
- At desktop widths, preserve the existing side-by-side heading and link layout.
- Ensure the mobile heading and link do not overlap or cause horizontal
  overflow.

## Verification

- Run the frontend TypeScript check.
- Verify the requested heading line breaks and link placement at 390px width,
  plus the desktop header layout.
