# Style the listing rating badge orange

On the listing detail page (`frontend/app/listings/[id]/listing-detail.tsx`),
give the rating badge the same orange fill and readable white text treatment as
the “rooms available” and accommodation-type badges.

Keep the star icons visually recognizable and preserve the existing accessible
rating description, including its review count. Do not reintroduce a visible
review-count number after the stars. Leave other listing pages and rating
display behavior unchanged.

Run frontend lint and TypeScript validation.
