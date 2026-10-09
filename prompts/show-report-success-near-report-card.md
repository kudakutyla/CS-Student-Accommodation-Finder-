# Show report success beside the report form

## Goal

Make the report-submission confirmation easy to notice by displaying
“Report submitted successfully” inside the **Report a concern** card rather
than only in the general notice area at the top of the listing page.

## Scope

- Update the listing detail page's report form UI only.
- Keep the existing report API call, payload, field reset, and failure handling.
- Store report success separately from notices used by other listing actions.
- Render a clearly visible, accessible `role="status"` confirmation within the
  report card near its heading and form controls.
- Clear the report confirmation when another report submission begins, and
  show it only after the API confirms success.
- Do not change report persistence, API contracts, or other workflows.

## Validation

- Run the frontend lint/type-check or the smallest existing check covering the
  listing detail page.
- Run `git diff --check`.
- Verify in the browser that the confirmation appears inside the report card
  after successful submission.
