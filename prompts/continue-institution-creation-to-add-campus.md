# Continue institution creation to campus entry

## Goal

After an administrator successfully creates an institution, take them directly
to a focused Add Campus step with that institution already selected. Provide a
clear back arrow to the admin dashboard from the Add Campus step.

## Implementation

1. Keep the current institution form, campus API integration, validation,
   authentication, and save error behavior.
2. Only after a successful new-institution API response, navigate into an
   Add Campus view for the same `/admin/campuses` route (or an equivalent small
   route state) and preselect the newly created institution by its returned ID.
   Do not navigate on failed requests or when editing an existing institution.
3. In the Add Campus view, focus the campus creation workflow rather than
   showing the institution creation form/list. Keep the existing campus address
   fields and backend geocoding behavior.
4. Add a visible accessible arrow link labeled “Back to dashboard” targeting
   `/admin/dashboard`.
5. After a campus is added, stay in Add Campus mode, retain the selected
   institution so another campus can be added, and surface the existing success
   and error states.
6. Support direct page refresh/deep links for the Add Campus view without
   losing the selected institution ID. If the query does not identify a valid
   institution, show a clear error and a way back to institution management;
   do not silently submit an unlinked campus.
7. Add focused tests only if a suitable frontend test setup exists; do not
   introduce a new frontend test framework. Do not change unrelated dashboard,
   institution, or campus behavior.

## Validation

- Verify successful institution creation opens Add Campus with that institution
  selected.
- Verify failed institution creation remains on the form and shows the error.
- Verify direct refresh of the Add Campus view retains the institution
  selection.
- Verify a created campus leaves the user in Add Campus with the institution
  retained, and the back arrow leads to the admin dashboard.
- Run focused frontend lint/build and `git diff --check`.
