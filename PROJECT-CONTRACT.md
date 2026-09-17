# Student Accommodation Finder
## Project Contract, Phases, Sprints, and Acceptance Criteria

**Document status:** Baseline contract
**Contract version:** 1.0
**Date:** 2026-09-17
**Repository:** `CS-Student-Accommodation-Finder-`

## 1. Contract Purpose

This document is the working contract for the Student Accommodation Finder project. It defines:

- the problem the product must solve;
- the users and responsibilities in the system;
- the technical and security rules that cannot be weakened;
- the phases and sprints required to deliver the product;
- the acceptance criteria for each sprint;
- the boundary between implemented functionality, committed scope, and future scope.

This document is based on the current repository, including the backend API, Prisma data model, seed data, automated tests, frontend pages, and project notes. Where the repository does not define a later sprint explicitly, the later sprint is marked **proposed** rather than presented as completed work.

## 2. Product Problem

Students looking for off-campus accommodation currently depend on scattered social-media posts, informal referrals, and incomplete information. This makes it difficult to compare properties, judge distance from campus, identify trustworthy landlords, and know whether a listing is still available.

The product must provide one searchable, trustworthy platform where students can discover accommodation near a campus and where landlords can submit properties for controlled publication.

## 3. Product Outcome

The system will connect students with verified accommodation providers through:

1. authenticated, role-aware accounts;
2. campus-aware property discovery;
3. validated accommodation listings;
4. distance-aware search and comparison;
5. administrator approval before public listing visibility;
6. a foundation for favourites, enquiries, reviews, reports, and notifications.

The first release must be a real full-stack application using the Express API, Prisma/PostgreSQL persistence, and the Next.js frontend. Mock-only data is not an acceptable substitute for the database and API integration.

## 4. Users and Roles

### 4.1 Student

A student can:

- register and log in;
- view active campuses;
- search and filter approved accommodation;
- view listing details, photos, distance, amenities, availability, and ratings;
- use the student dashboard to begin the accommodation search journey.

A student cannot create, edit, delete, approve, or administer accommodation listings.

### 4.2 Landlord

A landlord can:

- register and log in;
- access landlord functionality only through the landlord role;
- create and manage their own listings once verified;
- submit listings for administrator approval;
- see the state of their own listings.

An unverified landlord cannot create or submit a listing. A landlord cannot modify another landlord's listing or use administrator functions.

### 4.3 Administrator

An administrator can:

- log in through a controlled account;
- manage campuses;
- view pending listings;
- approve or reject listings;
- provide a rejection reason;
- create an audit record for important moderation actions.

Public registration must never create an administrator account.

## 5. Technical Contract

### 5.1 Backend

- Node.js, Express, and TypeScript
- Prisma ORM with PostgreSQL/Neon
- JWT authentication
- bcrypt password hashing
- Zod request validation
- Helmet, CORS, and rate limiting
- Route/controller/middleware separation
- Consistent `{ success, data, message, errors }` API responses

### 5.2 Frontend

- Next.js App Router
- React and TypeScript
- Tailwind CSS v4
- API integration through `frontend/lib/api.ts`
- Auth state managed through `frontend/lib/auth-context.tsx`
- Role protection through `frontend/components/auth-guard.tsx`
- Student, landlord, and administrator experiences must remain distinct

### 5.3 Data and security rules

- Password hashes must never be returned to clients.
- Authentication must reject missing, invalid, and expired tokens.
- Deactivated accounts must not authenticate.
- Authorization must be enforced on the backend, not only in the frontend.
- Public listing results must contain approved listings only.
- Listing ownership must be checked before landlord updates or deletes.
- Campus coordinates and listing coordinates must be validated.
- Listing distance must be calculated server-side using the Haversine formula.
- Database state must be reset or isolated before repeatable integration tests.

## 6. Delivery Status Vocabulary

- **Implemented:** Present in the repository and supported by working code.
- **Tested:** Covered by an automated test or a successful build check.
- **Committed:** Required for the current project delivery target.
- **Proposed:** Recommended future scope inferred from the product model and problem; not yet a promise of completed functionality.
- **Out of scope:** Excluded unless this contract is deliberately revised.

## 7. Phase 0: Foundation and Project Definition

**Status:** Implemented, with documentation cleanup remaining.

### Sprint 0.1: Repository and architecture foundation

**Objective:** Establish a maintainable full-stack application structure.

**Deliverables:**

- Express backend with mounted API routes and health endpoint.
- Next.js frontend with App Router and global providers.
- Prisma schema connected to PostgreSQL.
- Environment-based configuration for API and database access.
- Seed data for local development and verification.
- Shared frontend API and authentication context.

**Acceptance criteria:**

- Backend starts and responds to `GET /api/health`.
- Frontend builds successfully with `npm run build`.
- Database schema can be generated, pushed, and seeded.
- The frontend can communicate with the backend through the configured API base URL.

## 8. Phase 1: Identity, Access, and Trust Controls

**Status:** Implemented and tested.

### Sprint 1.1: Authentication

**Objective:** Allow students and landlords to create accounts and use secure login sessions.

**Deliverables:**

- Student registration.
- Landlord registration with an unverified initial state.
- Login with email and password.
- bcrypt password hashing.
- JWT generation and verification.
- Authenticated `GET /api/auth/me`.
- Logout behavior.
- Account activity checks.
- Login, registration, and route protection UI.

**Acceptance criteria:**

- Valid students and landlords receive a user record and JWT.
- Duplicate email registration returns a conflict response.
- Invalid credentials return an authentication error.
- Password hashes are never included in API responses.
- Public administrator registration is rejected.
- Invalid, missing, or expired tokens are rejected.
- Deactivated users cannot log in or use authenticated routes.

### Sprint 1.2: Role-based authorization and ownership security

**Objective:** Enforce the system's role boundaries at the API layer.

**Deliverables:**

- `authenticate` middleware.
- `authorize` role middleware.
- Verified-landlord middleware.
- Student, landlord, and administrator route restrictions.
- Landlord ownership checks for listing mutation.

**Acceptance criteria:**

- Students cannot create listings or access administrator queues.
- Unverified landlords cannot create listings.
- Landlords cannot approve or reject listings.
- A landlord cannot edit or delete another landlord's listing.
- Administrators can access administrator-only endpoints.
- Forbidden responses are consistent and do not expose sensitive data.

## 9. Phase 2: Campus and Accommodation Discovery

**Status:** Backend implemented and tested. Frontend discovery is implemented; administrator campus controls and some presentation polish remain future completion items.

### Sprint 2.1: Campus management

**Objective:** Create the geographic structure used to organize and search accommodation.

**Deliverables:**

- Public active-campus listing.
- Campus detail retrieval.
- Administrator campus creation.
- Administrator campus editing.
- Administrator campus activation/deactivation.
- Campus coordinates and location data.
- Approved-listing counts per campus.
- Distance recalculation when campus coordinates change.

**Acceptance criteria:**

- Public users can retrieve active campuses.
- Inactive campuses are hidden from the default public campus response.
- Only administrators can create, edit, or toggle campus status.
- Duplicate campus names are rejected.
- Invalid coordinates and incomplete campus data are rejected.
- Changing campus coordinates recalculates associated listing distances.

### Sprint 2.2: Listing creation and validation

**Objective:** Allow verified landlords to submit complete, geographically accurate accommodation listings.

**Deliverables:**

- Listing creation endpoint.
- Listing title, description, campus, address, property type, price, room counts, amenities, photos, and availability fields.
- Server-side field validation.
- Positive price validation.
- Room-count consistency validation.
- At least one valid photo URL.
- Haversine distance calculation from listing to campus.
- Initial listing state of `PENDING`.
- Landlord-owned listing retrieval and management.

**Acceptance criteria:**

- Only verified landlords can create listings.
- `availableRooms` cannot exceed `totalRooms`.
- Price, coordinates, room counts, and required text are validated.
- The selected campus must exist.
- Distance is calculated by the backend and stored in kilometers.
- New listings are not publicly visible before approval.
- Listing photos are persisted with a primary photo designation.

### Sprint 2.3: Approval workflow and public search

**Objective:** Give administrators control over what becomes publicly discoverable and give students useful search tools.

**Deliverables:**

- Administrator pending-listing queue.
- Approve listing action.
- Reject listing action with reason.
- Audit log entries for moderation actions.
- Public approved-listing search.
- Campus filter.
- Search text filter.
- Price range filter.
- Maximum-distance filter.
- Accommodation-type filter.
- Availability filter.
- Amenities and rating filter support in the API.
- Sorting by price, distance, rating, and newest.
- Pagination metadata.
- Listing detail response.
- Student dashboard with campus and listing discovery.
- Student listings page with real API-backed filters.

**Acceptance criteria:**

- Pending and rejected listings do not appear in public search.
- Approved listings appear in public search and detail results.
- Approval and rejection actions require administrator authorization.
- Rejection reasons are persisted.
- Approval and rejection actions create audit records.
- Search filters return only matching approved listings.
- Sorting and pagination return correct order and metadata.
- Listing detail includes campus, photos, provider information, distance, availability, amenities, and ratings.
- The student dashboard links into the real listing search flow.

## 10. Phase 3: Student Decision Support

**Status:** Proposed. The Prisma model already contains much of the data foundation, but the end-to-end API and UI are not yet complete.

### Sprint 3.1: Favourites and shortlist

**Objective:** Let students retain and compare accommodation they may want to revisit.

**Deliverables:**

- Add/remove favourite listing endpoints.
- Student-only favourite access.
- Favourite state on listing cards and details.
- Student shortlist page.
- Duplicate-favourite protection.

**Acceptance criteria:**

- A student can favourite an approved listing.
- A student can remove a favourite.
- The same listing cannot be added twice by the same student.
- Students see only their own favourites.
- Unauthenticated users and landlords cannot mutate a student's favourites.

### Sprint 3.2: Reviews and ratings

**Objective:** Add trustworthy student feedback without allowing arbitrary manipulation.

**Deliverables:**

- Review creation, retrieval, and update/delete policy.
- Rating validation from 1 to 5.
- Listing average rating and review count.
- Review display on listing detail.
- Student identity and ownership checks.

**Acceptance criteria:**

- Only authenticated students can submit reviews under the defined eligibility rule.
- Ratings outside 1 to 5 are rejected.
- Average ratings are recalculated from stored reviews.
- A student cannot impersonate another reviewer or modify another user's review.
- Public listing data exposes review summaries safely.

### Sprint 3.3: Enquiries and messaging

**Objective:** Let students contact landlords about an accommodation listing.

**Deliverables:**

- Conversation creation tied to a listing.
- Student-landlord participant enforcement.
- Message creation and retrieval.
- Read/unread state.
- Conversation and message views for students and landlords.
- Input validation and access control.

**Acceptance criteria:**

- A student can start a conversation about an approved listing.
- Only the student and listing owner can read or send messages in that conversation.
- Messages are persisted in the database.
- Unread state is updated correctly.
- Users cannot use messaging to bypass listing or role restrictions.

## 11. Phase 4: Safety, Administration, and Operations

**Status:** Proposed. Data models exist for several items, but the complete workflows are not yet implemented.

### Sprint 4.1: Reporting and moderation

**Objective:** Give users a controlled way to report unsafe, inaccurate, or inappropriate listings.

**Deliverables:**

- Student report submission.
- Report categories and description validation.
- Administrator report queue.
- Report status transitions: pending, in review, resolved, dismissed.
- Moderation action history.
- Listing/user action policy for serious reports.

**Acceptance criteria:**

- Authenticated students can report an approved listing.
- Report content is validated and stored.
- Students cannot edit administrator report decisions.
- Administrators can process reports through defined statuses.
- Report actions are auditable.

### Sprint 4.2: Notifications

**Objective:** Keep users informed about relevant account and workflow events.

**Deliverables:**

- Notification creation for listing approval/rejection, messages, reports, and relevant account events.
- Read/unread state.
- Student, landlord, and administrator notification access rules.
- Notification display and mark-as-read behavior.

**Acceptance criteria:**

- Notifications are delivered only to the intended user.
- Notifications persist across sessions.
- A user can distinguish read and unread notifications.
- Notification actions do not reveal another user's private activity.

### Sprint 4.3: Administrator operations

**Objective:** Make the administrator experience complete enough to operate the platform.

**Deliverables:**

- Campus create/edit/toggle controls in the frontend.
- User verification and account status controls.
- Dashboard statistics.
- Audit-log review.
- Listing moderation detail view.
- Loading, error, empty, and retry states.

**Acceptance criteria:**

- Administrator actions are available only to administrators in both UI and API.
- Campus management can be completed without direct database access.
- Moderation actions show the affected listing and resulting status.
- Operational actions create appropriate audit records.
- Failed API requests produce actionable UI feedback.

## 12. Phase 5: Release Quality and Deployment

**Status:** Proposed.

### Sprint 5.1: Quality, accessibility, and responsive UX

**Objective:** Make the application usable and dependable across supported devices.

**Deliverables:**

- Responsive student, landlord, and administrator layouts.
- Accessible labels, keyboard navigation, focus states, and semantic controls.
- Consistent loading, empty, error, and success states.
- Image failure and slow-network handling.
- Form validation feedback.
- Browser-level smoke tests for critical journeys.

**Acceptance criteria:**

- Critical flows work on mobile and desktop widths.
- Keyboard users can complete login, search, and moderation flows.
- Forms communicate validation errors without data loss.
- Public listing pages remain usable when images fail to load.
- Critical routes have no blocking build, type, or lint errors.

### Sprint 5.2: Deployment and operational readiness

**Objective:** Prepare the real application for controlled deployment.

**Deliverables:**

- Production environment variable documentation.
- Database migration/deployment process.
- Backend and frontend deployment configuration.
- Secure production JWT secret configuration.
- Logging and error-monitoring strategy.
- Backup and recovery notes.
- Seed data policy for non-development environments.

**Acceptance criteria:**

- Production secrets are not committed to the repository.
- A clean environment can be configured from documented steps.
- Database migrations can be applied repeatably.
- The deployed frontend can reach the deployed backend.
- Health checks and failure behavior are documented.

## 13. Current Repository Baseline

### Implemented and verified

- Express API health endpoint.
- JWT authentication and bcrypt password hashing.
- Student, landlord, and administrator authorization rules.
- Verified-landlord listing restriction.
- Campus read and administrator management API.
- Listing validation and Haversine distance calculation.
- Listing photos and primary-photo selection.
- Listing approval/rejection workflow.
- Audit logging for listing moderation.
- Public approved-listing search, filters, sorting, pagination, and detail retrieval.
- Seed users, campuses, and approved sample listings.
- Student, landlord, and administrator dashboard routes.
- Student search/listings frontend flow.
- Landlord property workspace with listing statistics, approval states, and property cards.
- Verified-landlord property submission form connected to the listing API.
- Successful frontend production build.

### Known gaps at contract creation

- The root frontend page remains the default Next.js starter page and should become the public product entry point.
- Administrator campus create/edit/toggle controls are not yet complete in the frontend.
- Favourites, reviews, conversations, messages, reports, and notifications are represented in the data model but are not complete end-to-end product workflows.
- The campus integration test requires a clean database or isolated test data before repeated runs; existing seeded test data can cause a duplicate-campus `409`.
- Frontend request failures are often swallowed by dashboard loading handlers and should be surfaced through explicit error states.

## 14. Testing Contract

Every committed sprint must include:

- automated backend tests for authorization and critical business rules;
- validation tests for invalid input and boundary conditions;
- a frontend typecheck/build check;
- a clean-database or isolated-data test procedure;
- documented known limitations when external services or deployment infrastructure are unavailable.

The minimum release gate for the current Sprint 1/2 baseline is:

1. all Sprint 1 and Sprint 2 backend tests pass against a clean seeded database;
2. the frontend production build passes;
3. public search never exposes pending or rejected listings;
4. role and ownership restrictions are enforced by the backend;
5. database/API integration works without mock-only replacement.

## 15. Scope Boundaries

The following are not part of the current Sprint 1/2 commitment unless the contract is revised:

- payment processing or rent collection;
- lease signing or legal document management;
- identity-document verification automation;
- real-time chat infrastructure beyond the proposed messaging sprint;
- map-provider billing and turn-by-turn navigation;
- recommendation algorithms or machine learning;
- native mobile applications;
- multi-country tenancy, currencies, or legal compliance workflows;
- automated landlord background checks.

## 16. Change Control

A feature is part of the committed project only when it has:

1. a named phase and sprint;
2. a stated user outcome;
3. an implementation owner or identified code boundary;
4. acceptance criteria;
5. automated or executable verification where practical.

Changes to role permissions, public listing visibility, approval states, database relations, or API response contracts require this document and the relevant tests to be updated together.

The repository code may evolve, but this contract remains the reference for deciding whether a change belongs to the current delivery target or a later phase.
