# Populate campus options for active institutions

## Goal

Add real, institution-linked campus options so students and accommodation
providers can select a campus for the active universities already in the
application.

## Implementation

- Add a separate, safe, idempotent backend catalog-import command. Do not run
  or modify the destructive general-purpose Prisma seed as part of this task.
- Read active institutions from the database and query the existing
  OpenStreetMap Overpass campus lookup for each institution name/short name.
- Create active campus records only from mapped South African university or
  college features associated with that institution. Require a useful city or
  region, and resolve each candidate's coordinates through the existing
  server-side Nominatim helper with campus/locality context. Never use
  unverified or client-provided coordinates.
- Avoid duplicate campus records by the existing unique campus name. Preserve
  all existing campuses and all unrelated database records; if a campus name
  already exists, report/skip it rather than overwriting it.
- Support a dry-run mode and require an explicit apply flag for database
  inserts. Print a concise per-institution summary of created, already
  existing, unresolved, and unmapped campuses so gaps are visible.
- Keep imported campuses linked to their institution so both student and
  provider campus selectors can use institution-aware results.
- Include a focused test for idempotent/name conflict handling and
  geocoding-error handling where the importer structure allows it.
- Document the exact safe command and note that the general seed clears
  existing data and must not be used to populate campuses.

## Validation

- Run focused backend tests and backend TypeScript check.
- Run the importer in dry-run mode against the configured database and review
  the institution/result summary.
- Apply only the mapped, geocoded campuses without deleting existing data.
- Verify campus records are active and linked to their institutions through
  the existing admin campus API/database read.
- Run `git diff --check`.
