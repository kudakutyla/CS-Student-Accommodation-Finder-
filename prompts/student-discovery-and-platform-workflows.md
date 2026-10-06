# Student Discovery and Platform Workflow Improvements

## Approval gate

Implement this prompt only after explicit user approval. This request revises the current product contract in two areas: Google Maps route-distance calculation replaces the mandated Haversine distance, and map-provider billing is no longer out of scope. Before using Google Maps, require a backend-only `GOOGLE_MAPS_API_KEY` supplied through the local ignored environment file; never request, print, commit, or expose the key. If the key is not configured, report the exact prerequisite and do not silently substitute campus coordinates or a different distance provider.

## Existing implementation findings

- `frontend/app/listings/page.tsx` exposes free-text Location and Max distance filters.
- `frontend/app/student/dashboard/page.tsx` displays the Available rooms, Nearby homes, and Verified landlords metrics; the last value is currently derived from active campus count.
- `frontend/app/login/page.tsx` and `frontend/app/register/page.tsx` use password fields without visibility controls.
- `frontend/app/landlord/listings/create/page.tsx` already has an institution-then-campus selection, but the campus is not required to have an institution in the data contract and property images are comma-separated URLs.
- Prisma has an `Institution` model and public institution reads, but no administrator institution create/update/status endpoints or form.
- `Campus` stores an address and coordinates. Admin campus forms currently require manual latitude/longitude.
- Listing creation can geocode an address, but the current provider is OpenStreetMap Nominatim and lookup failure silently falls back to campus coordinates.
- `ListingPhoto`, profile pictures, and message attachments currently store URL strings; the message composer/profile forms ask for URLs.
- Report status updates already notify the reporting student, but the admin cannot add a note and the notification only contains the status.
- Admin operations are presented as sections on one dashboard. Audit history is fetched as the latest 100 entries without filters.
- `frontend/components/Navbar.tsx` renders Home and places the profile control before Saved homes, Messages, and Updates. The authenticated application shell has its own role navigation.

## Product requirements

### Student discovery and access

1. On every student discovery/filter surface, remove the user-entered Location and Max distance (km) fields. Use institution followed by campus selection to scope discovery; keep useful non-geographic filters such as price, accommodation type, availability, and keyword search only when they do not ask students to enter a location. Do not send a user-entered max-distance filter.
2. Apply institution-first, campus-dependent selection consistently on the landing search and student discovery views. Changing institution clears the selected campus. A campus option must belong to the selected institution.
3. Hide the student dashboard KPI row containing Available rooms, Nearby homes, and Verified landlords. Do not replace it with the same counts elsewhere on the student dashboard.
4. A guest clicking Find Accommodation, View all accommodation, Explore the full collection, campus cards, listing cards, or equivalent browse links must be sent to `/login` with a safe return path. Protect direct access to listing search and details too; after login, return the user to the originally requested page. Preserve public landing-page content that does not reveal browse results.
5. When authenticated, remove Home from the global header. Keep Home for guests. On student navigation, order the signed-in controls so the profile initials/name control appears after Updates and immediately before Sign Out. Preserve role-specific routes and do not expose student navigation to landlords or admins.

### Password visibility

6. Add accessible show/hide controls to login password, registration password, and confirm-password fields. Each field can be toggled independently; use a real button with an accessible name/state, preserve keyboard operation, and do not alter password submission or validation behavior.

### Institutions, campuses, and addresses

7. Admins manage institutions and campuses. Add institution create/edit/activate/deactivate capability using database/API persistence; public users can read active institutions only. A campus must be associated with one institution for new/edited records. Keep campus options filtered by institution for both students and landlords.
8. The admin creates an institution before adding its campuses. Campus create/edit requires institution, campus name, city/region, and full street address. Remove manual property-coordinate entry from landlord forms. Resolve campus coordinates from its address on the backend so campus location is usable by the distance service.
9. Handle legacy campuses with no institution explicitly: provide an admin path to assign one before they appear in institution-scoped student/landlord selectors. Add a safe migration/backfill strategy; do not attach records to an arbitrary institution.
10. Update Prisma schema, migrations, validators, API types, campus/institution APIs, admin pages, and seed/test fixtures consistently. Enforce admin authorization on institution mutations in the backend.

### Address-based Google Maps distance

11. Use Google Maps server-side address geocoding and route-distance calculation between the landlord-entered property address and the selected campus address (Google Maps Routes API or the currently supported Google route-distance endpoint). Convert the returned distance to kilometres and persist it for listing display and distance sorting/filtering. Do not accept client-submitted latitude/longitude as authoritative and do not calculate distance in the browser.
12. The landlord enters a complete property address; the server resolves it and computes distance against the campus. If either address cannot be resolved, the route service fails, or its key is missing, reject listing submission with a clear actionable error. Never silently use campus coordinates as the property coordinates or report a zero distance.
13. Keep the API key server-only and document the required Google API enablement, key restrictions, and local environment variable name in the appropriate setup documentation without writing any secret. Add unit tests with the Google service mocked; no test may make billable Google requests.
14. Update `PROJECT-CONTRACT.md` to reflect the approved Google route-distance behavior and service prerequisite. Keep authorization, address validation, and calculation on the backend.

### Actual file uploads

15. Replace URL text entry with actual file selection and multipart uploads for landlord listing photos, student/landlord profile pictures, and message attachments. A user must be able to select files from their device, see selected filenames/previews where appropriate, remove selections before submit, and receive clear type/size errors. Do not accept externally supplied image/document URLs as a substitute for uploaded files.
16. Implement backend upload handling with authenticated role/ownership checks, size and MIME allowlists, generated storage names, safe paths, and no trust in client-provided filenames or content types. Store listing images and avatars as files and persist only server-generated storage references/metadata. Listing photos remain available to students only for approved public listings. Message documents remain private and downloadable only by conversation participants. Do not expose local filesystem paths or private attachment URLs.
17. Check existing deployment/storage configuration before choosing a provider. Reuse a configured durable object store if one exists; otherwise add a small storage adapter with a local persistent development implementation, keep uploaded files out of version control, and document the production persistence requirement. Do not add a large storage platform or unrelated media workflows.
18. Update the shared frontend API helper so JSON requests retain JSON headers while `FormData` requests allow the browser to set the multipart boundary. Cover upload authorization, invalid file types, oversize files, and upload persistence with focused tests.

### Student reports and admin response

19. On report review/status changes, let an admin optionally enter a student-facing note. Persist the note with the report and include it in the student notification for IN_REVIEW, RESOLVED, and DISMISSED transitions. The student can view the status and admin note through notifications and/or a report history view. A status transition and its audit record/notification must be transactional.
20. Validate and bound note length; render it as text (never HTML). Keep reporter identity protected from other students. Preserve the existing rule preventing updates to closed reports unless the product contract is deliberately changed.

### Admin navigation and audit

21. Make each admin navigation item its own URL/page instead of an anchor into a long combined dashboard: Dashboard, Campuses (including institution management), Pending listings, Reports, Audit history, and Updates. Preserve the admin-only guard, active-page state, mobile navigation, and existing API-backed operations. Each page owns its relevant loading/error/empty states and should not require fetching unrelated admin datasets.
22. Add audit-history filters for start date, end date, and target category (`USER`, `REPORT`, `LISTING`, `CAMPUS`, `INSTITUTION`, `SYSTEM`, and All). Apply filters in the API/database query, validate date ranges, and preserve newest-first ordering. Do not fetch all history and filter only in the browser. Keep filters composable and provide a clear/reset action.

## Architecture and safety constraints

- Follow root `AGENTS.md`, `frontend/AGENTS.md`, the current project contract, and the repository's Next.js-specific guidance before frontend edits.
- Inspect current diffs before touching already-modified files; preserve all user changes and generated output not required by this task.
- Keep API access in `frontend/lib/api.ts`, authentication in `frontend/lib/auth-context.tsx`, and role protection in `frontend/components/auth-guard.tsx`.
- Enforce every role, ownership, report visibility, upload access, and moderation rule on the backend.
- Preserve the established `{ success, data, message, errors }` API response shape. Never expose password hashes, Google API credentials, database credentials, private attachment paths, or unapproved listing data.
- Make the smallest coherent migrations and update tests, seed data, and documentation. Do not run schema writes against a shared/production database. Use a verified isolated database for data-mutating integration tests.
- Read the relevant installed Next.js documentation before frontend implementation, per `frontend/AGENTS.md`.

## Acceptance checks

- Guest browser checks confirm each specified browse CTA and direct listing route goes to login, then returns after successful login.
- Authenticated student and landlord headers omit Home; student profile control is between Updates and Sign Out. Guest header still includes Home.
- Password show/hide works independently for login and both registration fields with keyboard and screen-reader labels.
- Student dashboard has none of the three named count metrics; search pages have no Location or Max distance inputs and use institution then filtered campus.
- Admin can create an institution, create a campus under it with an address, edit/deactivate/reactivate each, and only active institution/campus choices appear publicly. Existing unassigned campuses can be assigned safely.
- Listing submission uses only the typed address and selected campus, calculates/persists Google route distance server-side, and returns a useful failure for unresolved addresses or missing service configuration. No fallback or client-coordinate override is accepted.
- Users can upload actual listing images, profile photos, and message documents. Verify previews, upload errors, persistence, listing-publication gating, and private-message attachment authorization.
- Admin report status plus optional note creates a student notification; the student sees status and note. Audit entry and notification are committed with the report update.
- Admin navigation opens distinct pages for all six entries. Audit filtering is enforced by the backend for date range and target category.
- Add/update focused automated backend tests for authorization, validation, address/service failures, report notification contents, file access, institution/campus rules, and audit filters. Add focused frontend tests where the repository has an established test setup; otherwise provide exact manual browser steps.
- Run backend tests/build and frontend lint/typecheck/build where safe. Run integration tests only against a verified isolated database; report any blocked checks. Exercise desktop and mobile workflows and report exact commands/results.

## Completion report

List the completed behaviors, migrations and environment prerequisites, checks run and results, any test that could not run and why, and concise manual browser test steps. Do not claim Google Maps or uploads work end-to-end without verifying the configured service/storage and a real upload flow.
