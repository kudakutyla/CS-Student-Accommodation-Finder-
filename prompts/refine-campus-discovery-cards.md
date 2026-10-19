# Refine campus discovery card content layout

In `frontend/app/page.tsx`, refine the homepage campus cards:

- Place the listing count in the top-left corner as a compact, readable badge.
- Keep the campus/institution name and location together at the bottom-left.
- Reduce the campus name size, especially on mobile, so more of the campus background
  image remains visible. Allow long names to wrap cleanly without overflowing the card.
- Use a restrained bottom gradient or equivalent treatment so the bottom-left text remains
  legible without darkening the entire image unnecessarily.

Preserve campus data, card links, responsive grid, and existing behavior. Verify the
two-column mobile view and desktop grid for legibility and no horizontal overflow. Run
frontend TypeScript and targeted ESLint checks.
