# Download admin audit history as PDF

## Goal

Add an admin-only “Download PDF” action to Audit history. The PDF should include
the audit entries currently displayed after applying filters and clearly state
the active date/category filters.

## Implementation

1. Inspect the audit-history page and current API behavior. Keep the existing
   server-backed filter flow; do not generate an unfiltered dataset or change
   audit authorization.
2. Add a real client-side PDF download using a maintained lightweight PDF
   package compatible with the existing Next.js client page. Add only the
   required dependency and lockfile update using the repository's package
   manager.
3. Include a clear title, report generation time, applied From/To/category
   filters, and every loaded entry's timestamp, action, target type,
   description, and admin name.
4. Handle long descriptions and page breaks so content remains readable and no
   rows are clipped. Use a deterministic filename such as
   `audit-history-YYYY-MM-DD.pdf`.
5. Disable the export action while entries are loading, when a request failed,
   or when the filtered result contains no entries. Keep loading/error/empty
   states explicit.
6. Do not change backend APIs or add unrelated audit functionality.

## Validation

- Run frontend lint and production build/type-check.
- Verify downloading with no filters and with date/category filters produces a
  valid multi-page-capable PDF containing exactly the displayed entries and
  the selected filters.
- Run `git diff --check`.
