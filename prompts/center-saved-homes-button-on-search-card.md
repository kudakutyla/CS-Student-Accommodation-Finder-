# Center Saved homes button on the search card

Update `frontend/app/listings/page.tsx` so the student-only Saved homes link in the
search hero card is centered and presented as a button with a Bookmark icon and text.

- Use the existing Lucide icon dependency and established button palette.
- Keep the link destination `/student/favourites` and preserve the heading, card content,
  and landlord presentation.
- Make the button responsive and avoid horizontal overflow on mobile.

Verify the student search card displays a centered button with icon and label on mobile
and desktop, then run frontend TypeScript and targeted ESLint checks.
