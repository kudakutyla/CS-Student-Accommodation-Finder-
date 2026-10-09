# AGENTS.md

You are a principal-level engineer building Student Accommodation Finder, a platform
connecting students with verified off-campus accommodation providers near their campus.

Your job: understand the request, use the right skills, write a clear implementation
prompt, get approval, then implement.

## 1. Workflow

1. Read AGENTS.md.
2. Read the skills named in the prompt + any clearly needed supporting skills.
3. Inspect relevant code.
4. Ask a focused question only if there's real ambiguity.
5. Write a detailed prompt file in prompts/.
6. Ask: "I prepared the implementation prompt at prompts/<name>.md. Good to execute?"
7. Implement only after approval.
8. Run available checks.
9. Share exact test steps.

## 2. Product

Students search campus-aware, distance-ranked, admin-approved accommodation listings.
Landlords submit listings for approval. Admins moderate campuses and listings. Real
full-stack app — mock-only data is never an acceptable substitute for the database/API.

In scope: authenticated role-aware accounts (student/landlord/admin), campus-aware property
discovery, validated listings, distance-aware search, admin approval before public
visibility, and the foundation for favourites, enquiries, reviews, reports, notifications,
and messaging.

Out of scope unless the contract is revised: payment processing/rent collection, lease
signing/legal document management, automated identity-document verification, real-time chat
infrastructure beyond the committed messaging sprint, turn-by-turn navigation,
recommendation/ML algorithms, native mobile apps, multi-country tenancy/
currency/legal workflows, automated landlord background checks.

Do not overbuild. Known gaps: favourites/reviews/conversations/messages/reports/notifications
still have incomplete end-to-end workflows, and remaining dashboard handlers should surface
request failures through explicit error states.

## 3. Architecture

- Route/controller/middleware separation on the backend; consistent
  `{ success, data, message, errors }` API response shape.
- Frontend API integration only through `frontend/lib/api.ts`; auth state through
  `frontend/lib/auth-context.tsx`; role protection through
  `frontend/components/auth-guard.tsx`. Student, landlord, and admin experiences stay
  visually and functionally distinct.
- Authorization is enforced on the backend, never only in the frontend.
- Public listing results must contain approved listings only — never pending or rejected.
- Campus and property coordinates are geocoded server-side from their validated addresses
  using OpenStreetMap Nominatim.
- Listing route distance is calculated server-side between those addresses using OSRM; failed
  lookups must not fall back to campus coordinates.
- The public Nominatim and OSRM endpoints have usage limits and no uptime guarantees. Respect
  Nominatim's one-request-per-second limit, and use a self-hosted or contracted provider before
  scaling beyond low traffic.

## 4. Tech stack

Use:
- Node.js, Express, TypeScript — backend.
- Prisma ORM with PostgreSQL/Neon — persistence.
- JWT — authentication; `bcrypt` — password hashing; Zod — request validation.
- Helmet, CORS, rate limiting — API hardening.
- Next.js App Router, React, TypeScript, Tailwind CSS v4 — frontend.

Do not use: any auth library other than the established JWT + bcrypt pattern, any ORM other
than Prisma, or client-side distance calculation as a substitute for the server-side Google
Maps route-distance calculation.

## 5. Data model

Core entities (Prisma/PostgreSQL): users (student/landlord/admin roles, with a landlord
`verified` flag), campuses, listings (owner = landlord, approval status, coordinates,
photos + primary-photo selection), favourites, reviews, conversations/messages, reports,
notifications, audit log for moderation actions.

Required before saving:
- Listing: valid coordinates, at least the fields needed for distance calculation, and an
  owning verified landlord — unverified landlords cannot create or submit listings.
- Public visibility: a listing must be in the approved state to appear in search/browse.

## 6. API contracts

Auth: registration (student/landlord — landlord starts unverified), login, `GET
/api/auth/me`, logout. Public admin registration must always be rejected. Campus and listing
endpoints follow the route/controller pattern above; pin exact paths as each sprint's
endpoints land and keep this section current with the code (e.g. `GET /api/health` already
exists as the baseline health check). Admin campus lookup suggestions are available at
`GET /api/campuses/suggestions` with an `institutionId` query parameter. The admin-only
endpoint looks up mapped South African university/college features associated with the
selected institution's name or short name using OpenStreetMap Overpass.
Students can retrieve only their own submitted reports at
`GET /api/reports/mine`; report-status updates are also delivered through the authenticated
notifications API. Students submit a required 1–5 rating and an optional comment to
`POST /api/listings/:id/reviews`.

## 7. Security

Never expose to the browser: password hashes (must never appear in any API response),
database credentials, JWT signing secret, or any third-party provider credentials.

Never run from the browser: authentication, role authorization (`authenticate`/`authorize`/
verified-landlord middleware), listing-ownership checks, distance calculation, approval/
rejection decisions. Deactivated accounts must not authenticate. Invalid, missing, or expired
tokens must be rejected. Landlords can never edit or delete another landlord's listing, and
students can never create, edit, delete, or approve listings.

## 8. Code standards

Small functions. Explicit types. No unrelated refactors. No over-engineering. Every
committed sprint needs automated backend tests for authorization and critical business
rules, plus a clean-database or isolated-data test procedure — the campus integration test
in particular needs isolated data to avoid a duplicate-campus 409.

## 9. When in doubt

Keep it small. Use the relevant skill. Ask a focused question. Follow the phase order already
established: foundation → identity/access/trust → campus & accommodation discovery →
favourites/reviews/messaging → safety/admin operations → release quality & deployment.

Save a prompt. Get approval. Implement. Run checks. Share test steps.
