# Fix report submission failures

## Problem

Submitting a student report currently returns `Failed to submit report` when any
part of the backend report-creation transaction fails. That transaction couples
the primary report write to admin lookup and notification fan-out, so an
ancillary notification failure can roll back an otherwise valid report.

## Implementation

- Persist a valid report independently of admin notification delivery.
- After report creation, notify active admins as before.
- If notification lookup or delivery fails after the report is saved, log the
  failure explicitly and return a truthful success response stating that the
  report was received but the admin alert could not be delivered. Do not claim
  full notification success or return a generic report-submission failure.
- Keep validation, authentication, authorization, approved-listing checks, and
  report ownership unchanged.
- Update the report form to display the API response message so partial
  notification failures are visible to the student.
- Add focused backend tests proving report persistence succeeds despite
  notification failure, while report persistence failure still returns an error.

## Validation

- Run the focused report controller tests, backend TypeScript check, and
  frontend lint/type-check for the touched report form.
- Run `git diff --check`.
- Avoid submitting test reports to a shared database.
