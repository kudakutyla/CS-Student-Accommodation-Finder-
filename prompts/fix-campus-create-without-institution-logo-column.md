# Fix campus creation without the optional institution logo column

The current database does not yet contain the optional `Institution.logoUrl`
column. The campus-creation controller uses `prisma.institution.findUnique`
with no explicit `select`, so Prisma includes that missing column in the lookup
and returns `Failed to create campus` before geocoding or persisting the
campus.

Update the institution lookup in `createCampus` to explicitly select only the
fields needed for validation, excluding `logoUrl`. Keep the lookup's existing
not-found behavior, all geocoding and validation rules, duplicate-campus
handling, campus creation, and audit logging unchanged.

Add a regression assertion to the focused campus controller tests confirming
the lookup selects only schema-independent required fields. Do not apply a
database migration or alter the database.

Run the relevant backend campus tests and backend TypeScript validation.
