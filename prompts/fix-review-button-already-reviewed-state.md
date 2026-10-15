# Fix review submit feedback for already-reviewed listings

## Finding

The current listing page shows the review form even when the signed-in student
already has a review for that listing. The API correctly enforces one review per
student per listing and responds with HTTP 409, leaving the student with the
misleading impression that the submit button is broken.

## Implementation

- Determine whether the authenticated student already has a review by comparing
  their user ID with each review's user ID.
- Hide the review submission form once their review exists and show a clear
  message that one review has already been submitted for this listing.
- Keep showing the existing review in the review list.
- Preserve the backend duplicate-review protection and do not add review edits
  or repeat submissions.
- Add focused frontend validation if an established test setup exists; do not
  create or modify live review data.

## Validation

- Run frontend lint and TypeScript checks for the listing detail page.
- Verify that a student with an existing review sees the review and the
  explanatory message but not an enabled submit form; verify that a student
  without a review can still select stars and submit an optional comment.
- Run `git diff --check`.
