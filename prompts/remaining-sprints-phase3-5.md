# Complete the Remaining Product Sprints (Phases 3-5)

## Objective

Implement the unfinished, in-contract work for Phase 3 (Student Decision Support), Phase 4 (Safety, Administration, and Operations), and Phase 5 (Release Quality and Deployment) in `PROJECT-CONTRACT.md`. Work incrementally by sprint, preserve the existing product design and architecture, and leave the repository buildable and tested after each sprint-sized slice.

## Required first steps

1. Read `AGENTS.md`, `frontend/AGENTS.md`, `PROJECT-CONTRACT.md`, and relevant local Next.js documentation before editing frontend code.
2. Inspect `git status` and review all existing changes before touching affected files. The current worktree contains uncommitted backend changes for API route/controller work; treat them as user work, understand them, and preserve them. Do not overwrite or revert them.
3. Verify each contract item against the current code and tests. The public root product page already exists; do not recreate it. Admin campus controls and several end-to-end workflows remain incomplete.
4. Do not change database providers or replace the current Neon configuration. Never print, commit, or copy credentials. Do not run seed/reset/drop commands or mutate a live database. Use isolated test data and document any database-backed check that cannot safely run in this environment.

## Sprint 3: Student Decision Support

### 3.1 Favourites and shortlist

- Audit and complete student-only add/remove/list endpoints and ownership checks, using the existing API response shape and Prisma uniqueness constraint.
- Reject favourites for non-public listings; make add/remove operations idempotent where practical.
- Add authenticated favourite state to discovery/detail UI, a student shortlist route, and empty/loading/error states.
- Test role restrictions, duplicate requests, private ownership, and approved-listing requirements.

### 3.2 Reviews and ratings

- Audit and complete review create/read and the chosen update/delete policy; document the policy in the contract.
- Enforce rating range 1-5, authenticated student ownership, and the eligibility rule (review only an approved listing; prevent duplicate reviews unless the documented policy explicitly allows editing the student's own review).
- Include safe average/count summaries on public approved listings and render reviews on listing details.
- Add focused validation, authorization, duplicate, and aggregation tests.

### 3.3 Enquiries and messaging

- Audit and complete conversation creation, message list/send, participant checks, and read/unread state.
- Derive student, landlord, and listing owner from the authenticated principal and database; never trust client-supplied participant IDs.
- Only allow a student to initiate an enquiry for an approved listing. Only the associated student and owning landlord may read or send in that thread.
- Add student and landlord conversation inbox/detail UI, input validation, and loading/empty/error states.
- Test participant isolation, role boundaries, message persistence, and read-state behavior.

## Sprint 4: Safety, Administration, and Operations

### 4.1 Reporting and moderation

- Complete authenticated student report submission for eligible public listings and an admin queue with validated status transitions (`PENDING`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`).
- Enforce backend authorization, prevent reporter edits to moderation decisions, and record moderation actions in audit history.
- Add admin report queue/detail/action UI and student submission feedback. Define any serious-report listing action explicitly; do not automatically hide listings without a documented policy and tests.
- Test report validation, ownership, status transitions, and audit records.

### 4.2 Notifications

- Complete persistent notification creation for relevant listing approval/rejection, message, report, and other implemented workflow events.
- Ensure notifications are only readable/mutable by their recipient; support unread state and mark-as-read.
- Add a restrained notification view/control for authenticated student, landlord, and admin users.
- Test event creation and recipient isolation; do not add external email/SMS delivery.

### 4.3 Administrator operations

- Complete campus create/edit/activate/deactivate controls using the existing campus API.
- Add user verification and account activation controls only if the backend provides audited, administrator-only operations; add those operations and tests if missing.
- Complete admin statistics and audit-log review APIs/UI, including listing moderation details and rejection reason.
- Surface loading, empty, retryable error, success, and pending-action states instead of swallowing request failures.
- Test every privileged operation against student, landlord, and admin identities.

## Sprint 5: Release Quality and Deployment

### 5.1 Quality, accessibility, and responsive UX

- Audit critical student, landlord, and admin journeys on mobile and desktop widths.
- Fix semantic labels, keyboard access, focus visibility, form error feedback, and image/network failure handling in the touched flows.
- Ensure all user-facing requests have explicit loading, empty, success, and actionable failure states.
- Add browser-level smoke coverage using the testing stack already present; do not introduce a second browser framework without need.

### 5.2 Deployment and operational readiness

- Document required frontend/backend environment variables with placeholders only, migrations/deploy procedure, health checks, production JWT-secret requirements, logging/error-monitoring approach, backup/recovery considerations, and production seed policy.
- Add only provider-neutral deployment configuration that is supportable from the repository. Do not deploy, provision services, or claim production readiness without credentials and a real deployment verification.
- Ensure production secrets are not tracked and avoid changing database credentials.

## Engineering constraints

- Backend authorization is authoritative; frontend guards are supplementary.
- Preserve `{ success, data, message, errors }`, the existing Prisma/PostgreSQL/JWT stack, and API integration through `frontend/lib/api.ts` and auth state through `frontend/lib/auth-context.tsx`.
- Public results and detail views expose approved listings only. Never return password hashes or unrelated private user data.
- Keep controller/route/validator separation and add automated backend tests for authorization and critical rules for each completed sprint.
- Do not implement out-of-scope payments, lease signing, automated identity checks, real-time chat infrastructure, recommendations/ML, native apps, or unrequested redesigns.
- Update `PROJECT-CONTRACT.md` only when a sprint's behavior is implemented and verified; distinguish unavailable external verification from passing checks.

## Validation and completion

- Run focused backend tests for each touched feature and frontend typecheck/build after the related slice.
- Run the broader available test suite and production build at the end; report pre-existing or environment-blocked failures without masking them.
- Never reset or seed the configured Neon database as a test shortcut. Document the exact safe, isolated test procedure and any checks requiring a separately provisioned test database.
- Summarize completed sprint items, remaining limitations, commands run, and manual test steps. Keep the worktree's pre-existing user changes intact.