# Color listing card text with the brand palette

Refine the accommodation listing cards on `frontend/app/listings/page.tsx` by
using the existing project color tokens to distinguish their information:

- Keep listing titles in the primary charcoal text color and monthly prices
  in terracotta.
- Style campus names with the sage accent.
- Style accommodation type labels with the terracotta accent.
- Style available-room counts with the success green accent.
- Use the existing brown/muted text colors for address, distance, and
  availability status; keep location details legible and consistent with the
  rest of the app.

Do not introduce new colors or change card structure, content, navigation,
listing data, or responsive layout. Ensure colors use CSS variables so the
existing theme variants remain respected. Run frontend lint and TypeScript
validation.
