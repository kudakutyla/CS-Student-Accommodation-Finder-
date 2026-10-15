# Sprint 2 Completion + Sprint 3 Foundation Implementation Plan

## Goal
Complete the remaining Sprint 2 work and build the Sprint 3 foundation for favourites, reviews, messages, and reporting, while using a local PostgreSQL setup instead of the Neon URL for development.

## Current project status
The repository is already in Phase 2 and the Sprint 2 backend groundwork is largely present, but some release-critical gaps remain:

- Sprint 2 campus/admin flows are present but not fully hardened and not fully proven against an isolated local database.
- Sprint 2 listing approval, visibility, and search logic are partially implemented but need validation against a clean database and edge-case checks.
- Sprint 3 features are only partially scaffolded in the Prisma schema and not implemented end-to-end in the API/UI.
- The repo currently assumes the external Neon database URL, which blocks local dev and test stability.

## Required approach
1. Switch the backend to a local PostgreSQL datasource for active development.
2. Run Prisma generate/push and verify the schema against local data.
3. Repair and validate all remaining Sprint 2 backend functionality.
4. Implement the missing Sprint 3 backend endpoints and route/controller patterns.
5. Keep the frontend aligned with backend contracts and role restrictions.
6. Verify with targeted automated tests and a clean DB reset flow.

## Scope of work

### A. Local database and environment setup
- Replace the external Neon connection with a local PostgreSQL connection in the backend environment config.
- Keep the schema and Prisma client generation compatible with the project’s PostgreSQL setup.
- Ensure a .env local setup is documented for reproducible local development.
- Make sure database-dependent tests can run without the Neon dependency.

### B. Complete Sprint 2
Focus on the committed Sprint 2 behavior described in the project contract.

#### 1. Campus management
- Ensure public campus list returns only active campuses by default.
- Ensure admin-only creation/edit/toggle routes are enforced by middleware and not just UI state.
- Validate duplicate campus names and invalid coordinates.
- Recompute listing distance values when campus coordinates change.
- Return proper counts for approved listings per campus.

#### 2. Listing creation and validation
- Confirm verified landlords only can create listings.
- Enforce `availableRooms <= totalRooms` and positive price checks.
- Validate campus existence and coordinates.
- Calculate `distanceFromCampus` using the server-side Haversine helper.
- Require at least one valid photo URL and ensure primary photo selection is consistent.
- Keep initial approval status at `PENDING` and ensure it does not appear in public search until approved.

#### 3. Approval workflow and public search
- Admin queue must return only pending listings.
- Approve/reject actions must update listing status and create audit log entries.
- Rejected listings must disappear from public search and retain rejection reason.
- Public search must only expose approved listings.
- Search/filter/sort/pagination logic must work with real database data and consistent response shape.
- Detail view must not expose password hashes and must respect access rules for non-approved listings.

### C. Implement Sprint 3 foundation
The Prisma schema already contains the required entities. Build the end-to-end API foundation for the following features.

#### 1. Favourites and shortlist
- `POST /api/listings/:id/favourite` and `DELETE /api/listings/:id/favourite`
- `GET /api/users/favourites` or equivalent authenticated route
- Prevent duplicates using the unique composite key
- Ensure only students can manage favourites; landlords/admins do not use student favourites flow

#### 2. Reviews and ratings
- `POST /api/listings/:id/reviews`
- `GET /api/listings/:id/reviews`
- Enforce one review per user per listing if required by product rules
- Calculate average rating in listing responses and summary DTOs
- Hide reviews from unapproved listings unless allowed by access rules

#### 3. Enquiries and messaging
- Message thread creation for a student + landlord + listing
- `GET /api/conversations` and `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
- Ensure thread ownership and conversation access are enforced
- Keep message payloads structured and consistent with the response contract

#### 4. Reports and notifications
- `POST /api/listings/:id/reports`
- `GET /api/notifications` for authenticated user
- Create notification records when relevant moderation or messaging events happen
- Keep reports stateful and reviewable by admin role

#### 5. Route and controller structure
- Continue the route/controller/middleware separation pattern already used by the project.
- Ensure every endpoint uses the project response contract: `{ success, data, message, errors }`.
- Enforce authorization on the backend for every protected action.

## Code constraints
- No mock-only database usage. Use real Prisma/PostgreSQL behavior.
- Keep functions small and explicit.
- No unrelated refactors.
- Do not overbuild beyond the Sprint 2/3 scope.
- Prefer targeted backend endpoints and minimal necessary frontend wiring.
- Do not remove existing working behavior unless it blocks the target sprint.

## Validation plan
- Run isolated database-backed tests for the campus and listing flows.
- Use a reset or clean-data workflow before repeatable tests.
- Add/repair tests for authorization and business rules, especially for:
  - campus admin restrictions
  - listing approval visibility rules
  - ownership checks
  - verified landlord restrictions
  - favourite and review validation

## Deliverables
1. Local PostgreSQL-backed development setup works.
2. Sprint 2 is fully functional and passing against a clean database.
3. Sprint 3 foundations for favourites/reviews/enquiries/reports/notifications are implemented in the backend.
4. Relevant tests pass or are added for the critical rules.
5. Clear local test steps are documented in the repo or terminal output.

## Execution order
1. Fix local DB configuration and Prisma connectivity.
2. Validate and fix Sprint 2 backend behavior.
3. Implement Sprint 3 backend routes and controllers.
4. Run the relevant backend tests and fix any remaining failures.
5. Confirm the project is on the correct sprint target and note remaining non-core polish.

## Acceptance criteria
- Local development no longer depends on the Neon URL.
- Sprint 2 flows are working against a clean local database.
- Backend authorization restrictions are enforced and tested.
- Sprint 3 core endpoints exist and behave consistently with the project response contract.
- The project is clearly on a Sprint 2/3 completion path without leaving the codebase in a broken state.
