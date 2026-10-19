# Move the Adjust filters label into the filter card

Update `frontend/app/listings/page.tsx` so “Adjust filters” appears in the filter card's
collapsible header immediately before its dropdown chevron.

- Keep the sliders icon and chevron, and preserve the existing expand/collapse behavior
  and accessibility attributes.
- Remove the separate “Adjust filters — open the Filters menu” control from the homes
  found card so the action is presented in one place.
- Preserve the result count and all filter controls and behavior.
- Ensure the header remains readable and usable on mobile and desktop.

Run frontend TypeScript and targeted ESLint checks, and verify the filter card header
shows “Adjust filters” before the chevron and still opens/closes.
