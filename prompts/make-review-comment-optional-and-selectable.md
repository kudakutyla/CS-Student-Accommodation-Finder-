# Make review comments optional and ratings selectable

## Goal

Let students submit a rating without writing a review, select a rating by
clicking stars, and make the report-details field clearly reset after sending a
concern.

## Implementation

- Update review validation so `rating` remains required (1–5), while `comment`
  is optional. Normalize omitted or whitespace-only comments to an empty string;
  if a comment is provided, retain the existing minimum and maximum length
  rules.
- Keep persisted and returned review data compatible with the existing
  non-null `Review.comment` field and review-list UI.
- Replace the rating dropdown on the listing detail page with an accessible,
  keyboard-operable 1–5 star selector with clear labels and selected state.
- Make the review text area optional and provide concise placeholder guidance.
- Keep report-details initially empty and, after successful report submission,
  reset it to empty while showing a placeholder watermark. Do not clear the form
  on failed submissions.
- Preserve existing validation, error handling, API routing, and other listing
  detail behavior.
- Add or update focused backend tests for a rating-only review, optional
  comments, and invalid non-empty comments.

## Validation

- Run focused review tests, backend TypeScript build, frontend lint and
  TypeScript check for the listing detail page, and `git diff --check`.
- Verify the star selector by mouse and keyboard, submit a rating with no
  comment, and verify the concern-details field is blank with placeholder text
  after a successful report submission.
- Do not create live reviews or reports in a shared database during
  verification.
