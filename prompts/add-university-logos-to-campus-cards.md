# Add University Logos to Student Dashboard Campus Cards

Add institution logos to the campus cards in the student dashboard's "Popular
campuses" section. Use the admin-managed logo URL approach: administrators enter
each institution's official logo URL, and every campus belonging to that
institution displays the same logo.

## Implementation

- Add an optional nullable `logoUrl` field to the Prisma `Institution` model and
  create the corresponding migration.
- Extend institution create/update validation to accept a nullable HTTP(S) URL.
  Preserve existing institution create, edit, activate, and deactivate behavior.
- Include `logoUrl` in public/admin institution API responses and in the nested
  institution object returned with campuses. Update frontend types and API
  request payloads accordingly.
- Add a clearly labeled optional logo URL field to the admin Institutions
  create/edit form. Populate it when editing; allow clearing it; include it when
  creating or updating an institution. Show a preview where practical, with an
  accessible alt description.
- Render the configured institution logo within the existing image panel on
  each student dashboard campus card. Keep the campus name, location, listing
  count, card navigation, and responsive layout unchanged. Use a graceful
  fallback when no logo is configured or an image fails to load; a missing logo
  must not break the dashboard.
- Use image handling compatible with arbitrary HTTPS logo hosts without
  unnecessarily weakening global Next.js image security settings.
- Do not scrape websites, download or invent logo artwork, or add unverified
  logos. Existing institutions can receive their official logo URLs through the
  admin form.

## Validation

- Add or update backend tests for valid/invalid logo URLs, nullable clearing,
  and API response inclusion.
- Add or update frontend coverage for rendering a logo and the no-logo/error
  fallback if a suitable test setup exists.
- Run the focused backend tests and the frontend type check/build.
- Verify the Prisma migration and ensure existing institution rows remain valid
  with `logoUrl = null`.
