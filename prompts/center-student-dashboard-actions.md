# Center student dashboard actions

## Goal

Center the “Search homes” and “Saved homes” links horizontally within the
student dashboard hero card.

## Implementation

- Update only the action container styling in
  `frontend/app/student/dashboard/page.tsx`.
- Keep both links, their destinations, labels, visual button styles, and all
  other dashboard content unchanged.
- Center the actions as a group on mobile and desktop, allowing them to wrap or
  stack on narrow screens.

## Validation

- Run frontend lint for the dashboard page.
- Run `git diff --check`.
- Verify the action group is centered within the hero card.
