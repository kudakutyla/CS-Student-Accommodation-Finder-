# Link rejected listings from the admin dashboard

Make the “Rejected listings” metric on the administrator dashboard clickable,
using the existing listing directory's status filter at
`/admin/listings?status=REJECTED`.

The admin listings page already supports the REJECTED filter and displays
listing details and rejection reasons. Reuse that path rather than duplicating
listing retrieval or rendering. Preserve dashboard card styling and ensure it
shows the same “View results” affordance and accessible link label as other
linked metrics.

Run frontend lint and TypeScript validation.
