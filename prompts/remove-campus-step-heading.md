# Remove the campus step heading

## Goal

Remove the redundant “Step 2” and “Campuses” heading from the campus
management page at `/admin/campuses`, matching the requested screenshot.

## Implementation

- Remove only the Step 2 eyebrow and Campuses heading above the campus form.
- Keep the address/geocoding helper text, campus form, saved-campus list, and
  all campus-management behavior unchanged.
- Preserve the existing layout spacing and styling without introducing
  unrelated UI changes.

## Validation

- Run the frontend lint/check for the edited campus management page.
- Run `git diff --check`.
