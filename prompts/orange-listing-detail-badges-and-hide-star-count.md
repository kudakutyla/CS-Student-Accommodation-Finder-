# Orange listing detail badges and hide visible star count

Update the listing detail and student dashboard home cards:

- On the listing detail page, give the “rooms available” and accommodation
  type badges an orange fill with readable contrasting text.
- On the student dashboard's latest approved home cards, present accommodation
  type and available-room count as matching orange badges, using the “rooms
  available” wording.
- Remove the visible parenthesized review count after the star rating on the
  listing detail page. Preserve the existing accessible `aria-label` with the
  review count.
- Keep the student dashboard star rating behavior and display as is; it
  already does not show the review count.

Preserve the existing listing data, navigation, and responsive layouts. Run
frontend lint and TypeScript validation.
