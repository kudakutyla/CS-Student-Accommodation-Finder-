# Improve listing filter visibility

## Goal

Make the collapsed Filters control on Find Homes easier to notice and understand.

## Implementation

- Add a visible filter icon next to the Filters dropdown label, alongside the
  existing chevron.
- Make the results-toolbar helper “Adjust filters from the Filters menu.” more
  prominent using clear contrast, stronger weight, and a subtle background or
  callout treatment consistent with the existing design system.
- Keep the dropdown behavior, accessibility attributes, Apply filters and Reset
  filters buttons, and listing search behavior unchanged.
- Do not change unrelated listing or report functionality.

## Validation

- Run focused frontend lint for `frontend/app/listings/page.tsx`, frontend
  TypeScript check, and `git diff --check`.
- Verify in the browser that the filter icon and emphasized helper are visible,
  and that the Filters dropdown still opens and closes.
