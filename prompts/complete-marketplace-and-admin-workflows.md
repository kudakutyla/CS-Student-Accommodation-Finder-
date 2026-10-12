# Complete requested marketplace and admin workflows

## Scope

Implement the user-requested frontend, backend, and configuration improvements
below. Preserve unrelated existing worktree changes, including the current
shared-shell changes and Messages page work.

## Navigation and messaging

1. Authenticated users must never see the public `Navbar` or authenticated
   actions in a page header on any route. Keep portal actions in the existing
   role-aware navigation: hamburger drawer on mobile and persistent sidebar at
   larger widths. Do not render a competing public header during auth loading.
   Keep the public login/register navigation for signed-out users.
2. Use a distinctly deeper background for the current user's sent attachment
   bubble (including PDF filenames such as `messaging-test.pdf`), with readable
   filename and type text. Preserve attachment downloads and incoming-message
   styling.

## Profiles and password reset

3. Add profile settings for students and landlords so they can update their
   name, email, and phone number in addition to the existing profile picture
   upload. Validate on the server, preserve role/verification fields, handle
   duplicate email explicitly, update auth context on success, and keep
   authorization server-side.
4. Add a complete forgot/reset-password flow using SMTP email:
   - Add public forgot-password and reset-password screens and links from login.
   - Generate cryptographically random, expiring, single-use reset tokens; store
     only a secure digest and consume the token atomically.
   - Return the same success response whether an email exists or not.
   - Validate new passwords server-side, prevent token reuse, and rate-limit
     reset requests.
   - Implement authenticated-independent `POST /api/auth/forgot-password` and
     `POST /api/auth/reset-password` API contracts. Validate request bodies with
     Zod. Do not reveal whether an account exists in response content, status,
     or materially different timing.
   - Add a dedicated Prisma reset-token model and migration; persist a unique
     token digest, user relation, expiration, and consumed state. Use a
     transaction/conditional update so simultaneous submissions cannot consume
     one token twice. Invalidate outstanding reset tokens after a password
     change.
   - Use a maintained SMTP mailer adapter and document the required private
     `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
     `SMTP_FROM`, and public `CLIENT_URL` settings in `backend/.env.example` and
     the operations documentation. Never log reset tokens or SMTP credentials.
     Keep a generic response for unknown email addresses; surface real delivery
     failures through server-side operational logging and setup documentation.
   - Add automated backend tests for unknown addresses, expired/invalid/reused
     tokens, successful reset, and password login with the new password.

## Role-aware discovery and dashboard

5. Keep landlord market discovery on `/listings`, but use landlord-oriented
   heading and explanatory copy instead of “Find your perfect student home”.
   Preserve student copy and shared filters/results.
6. Extend the landlord dashboard/API statistics with available-room totals
   grouped by accommodation type. Count `availableRooms` across all listings
   owned by the authenticated landlord, not just a client-side page subset.
7. After login, always route ADMIN users to `/admin/dashboard`, even when a
   redirect query parameter is present. Preserve safe redirects for
   non-admins.
8. Remove the redundant “Account trust / Students and landlords” section from
   the admin dashboard. Make the Students, Landlords, Verified landlords, and
   Pending listings statistics navigable to the corresponding filtered user
   results or existing pending-listings queue. Add a role/filter-aware admin
   user results view and retain admin-only access.
   Add validated optional role/verification filters to the admin users
   endpoint (Students = `STUDENT`, Landlords = `LANDLORD`, Verified landlords =
   `LANDLORD` plus verified). Render empty, loading, and error states in the
   results view. Keep pending listings linked to the existing pending queue.

## Institution and campus workflow

9. Fix institution creation/navigation: after creating or saving an institution,
   open its institution detail view. That view must show its campuses, support
   campus view/edit, and provide an “Add Campus” action that opens the add form
   with the institution already selected.
10. Use the Hipolabs Universities API dynamically as an admin-side source of
    institution suggestions/imports. Fetch suggestions through a bounded,
    timeout-protected admin-only backend integration, validate and normalize
    the response, default the search to South Africa, and show explicit
    loading/error/empty states. Admins explicitly create/save a selected
    institution in the application database; do not treat a suggestion as a
    persisted institution. Keep campuses database-managed and associated with
    the saved institution. Do not hardcode an external university catalog or
    add unrelated student profile fields.
11. Diagnose and fix campus add/edit failure paths. Preserve server-side address
    geocoding and report provider/configuration errors clearly. Update existing
    isolated-data campus tests or add focused tests for institution/campus
    management.

## Google Maps configuration

12. The backend already requires `GOOGLE_MAPS_API_KEY` for Geocoding and Routes,
    and the local `backend/.env` currently has no configured value. Add the
    backend-only variable to `backend/.env.example`, document the required
    Google APIs and safe local/deployment secret configuration, and ensure it
    is never exposed as a `NEXT_PUBLIC_*` variable or returned to clients.
    Do not fabricate, request in chat, or commit a key. The actual key must be
    set by the user in the backend environment/deployment secret store; without
    that private value, real geocoding cannot succeed.

## Implementation notes from repository inspection

- The existing shared `AppShell` already owns role links, mobile drawer,
  identity, and sign-out. Keep `Navbar` public-only and make sure its render
  branch is reachable only after auth has resolved as signed out.
- The current user profile `PATCH /api/users/me` deliberately rejects changes;
  implement its validated contract rather than bypassing it. Return the same
  safe public user shape as `/api/auth/me` and existing profile-picture upload.
- Auth middleware reloads current user data from the database, so profile email
  changes must be reflected in API responses and frontend auth context without
  trusting stale JWT claims.
- `/api/listings/my` currently returns all landlord listings and summary stats.
  Add grouped available-room counts to that authenticated response, grouped by
  `accommodationType`; define a stable typed response shape and cover zero-count
  types as appropriate. Do not derive the statistic from currently paginated
  frontend results.
- `/api/admin/users` currently has no filters. Extend the existing admin-only
  controller/route and `adminApi` wrapper rather than exposing user enumeration
  to public or non-admin clients.
- `/api/campuses/institutions` and `/api/campuses/:id` are existing catalog
  endpoints. Preserve their contracts and admin authorization when adding the
  institution detail/manage view.
- Current campus create/edit geocoding correctly fails without the backend-only
  Google key. Do not bypass geocoding or accept client coordinates as a
  fallback; improve the setup/error path and verify with mocked geocoding.
- The frontend/backend each have their own package manifests and lockfiles.
  If a SMTP dependency is needed, add it using the backend package manager and
  update only the corresponding backend lockfile.

## Validation

- Add/extend backend automated tests for profile editing, password reset,
  admin statistics navigation/filter data, and landlord grouped room counts.
- Add frontend tests if an established frontend test runner already exists;
  otherwise do not add testing infrastructure solely for this work.
- Run backend type-check/build and the targeted backend test set.
- Run frontend TypeScript, lint, and production build.
- Run `git diff --check`.
- If browser testing is available, verify authenticated navigation across
  routes and viewport sizes; test role-specific login destinations, profile
  settings, password-reset email flow, landlord market copy/statistics, admin
  result links, and institution-to-campus navigation.

## Acceptance criteria

- No authenticated route displays public navigation/actions in its page header;
  portal controls remain in the responsive role-aware sidebar/drawer.
- Sent file attachments have a deeper, readable outgoing background.
- Student and landlord profile settings persist validated editable profile
  fields; forgot-password can send and securely consume reset links over SMTP.
- Landlord discovery copy is role-appropriate and dashboard room counts reflect
  available room inventory grouped by accommodation type.
- ADMIN login lands on its dashboard; requested admin statistics lead to
  filtered results; the redundant account-trust section is removed.
- Saving an institution opens its campus-management view, and Add Campus opens
  an institution-scoped form. Hipolabs populates suggestions dynamically.
- Local and deployment Maps setup is documented and backend-only. A real Maps
  key remains a private runtime prerequisite supplied by the operator.
- SMTP credentials remain private runtime prerequisites; without configured
  SMTP, reset-link delivery cannot be exercised end to end. Verify the workflow
  with a mocked mail transport and report the required deployment setup.
