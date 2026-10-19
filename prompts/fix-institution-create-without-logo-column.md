# Fix institution creation when the optional logo column is missing

The configured database has the `Institution` table but does not yet have its
optional `logoUrl` column. The frontend sends `logoUrl: null`, and Prisma
institution creation fails because the generated create query includes the
missing column. The existing logo-column migration is pending, along with
other pending migrations; do not apply migrations or otherwise modify the
configured database as part of this change.

Update the backend institution creation handler to use its existing
`institutionLogoColumnAvailable()` compatibility check:

- If the logo column exists, preserve the current normal Prisma create behavior,
  including saving an optional logo URL.
- If the logo column is missing and no non-empty logo URL was submitted, create
  the institution without referencing `logoUrl` in either the data or returned
  columns, and return the API's usual institution shape with `logoUrl: null`.
- If a non-empty logo URL is submitted while the column is missing, return a
  clear actionable service error explaining that logo storage is unavailable
  until the institution logo database migration is applied. Do not silently
  discard the supplied URL.
- Preserve duplicate-name conflict handling and audit logging.

Add or update focused backend tests for create success on the missing-column
path and explicit handling when a logo URL is supplied without storage. Run
the relevant backend tests and TypeScript/build checks.
