# Full Functionality and Button Audit

## Objective
Run the Student Accommodation Finder locally, identify and fix confirmed failures in implemented workflows, and verify every interactive button/action, with particular attention to adding a campus and submitting a landlord listing. Preserve the existing product design and architecture.

## Confirmed current findings
- Backend and frontend TypeScript checks pass.
- The Prisma-mocked `student-workflows.unit.test.ts` suite passes (6 tests).
- Frontend lint exits successfully with 7 warnings: six `<img>` optimization warnings and one unused `UserRole` import.
- A fresh homepage load returns HTTP 500 for campus/listing data. Backend logs show Prisma `P2021`: `public.Campus` and `public.Listing` tables do not exist.
- `DATABASE_URL` and `DIRECT_URL` currently target different Neon hosts. Do not run Prisma schema commands until the database target is verified.
- The homepage previously displayed data in an older browser tab; treat that view as stale and reproduce using a fresh page.

## Safety and worktree requirements
1. Read root and frontend agent instructions, the project contract, and relevant Next.js 16 documentation before frontend edits.
2. Inspect `git status` and diffs for every file before editing. The worktree already contains substantial user changes across backend, frontend, docs, tests, prompts, and generated `backend/dist`; preserve them and avoid regenerating/overwriting tracked build output.
3. Never print, log, commit, or write credentials into this prompt or tracked files. The Neon password was exposed in chat; do not use it for database writes. Ask the user to rotate it and provide a replacement through the local ignored environment file.
4. Verify that `DATABASE_URL` and `DIRECT_URL` identify the same intended Neon project without printing values. The runtime URL may be pooled; Prisma tooling should use the matching direct endpoint.
5. Do not run `prisma db push`, migrations, seed, reset, or any other write against the configured Neon database unless the user explicitly confirms it is disposable development data and approves the exact operation. Prefer a separately provisioned isolated database for integration and browser workflows. If no isolated database is available, keep testing non-mutating and report which end-to-end checks remain blocked.
6. Do not claim all functionality passed based only on type checks, lint, or the health endpoint. Health does not prove database readiness.

## Audit scope
- Public journeys: home search, navigation, campus links, listing filters/reset/retry, listing detail, image/error states.
- Authentication: login, registration role selection, validation, success/failure feedback, role routing.
- Student: dashboard, save/unsave favourites, favourite list, enquiry creation, messages, reviews, reports, notifications, retry/loading/empty states.
- Landlord: dashboard, verified/unverified access, Add listing form validation and submit, listing status/details, messages/notifications.
- Admin: Add/Edit campus, activate/deactivate campus, refresh/retry, listing approve/reject, report status actions, landlord verification/account activation, audit history.
- For each button/control, establish whether it is a navigation link, submit action, or state/API mutation; verify its handler and API contract. Fix dead, miswired, duplicate-submit, inaccessible, or misleading actions only within existing scope.
- Preserve backend authorization and API response conventions. Do not make frontend-only authorization changes as a substitute for backend enforcement.

## Validation
- Run all database-independent backend tests, backend and frontend TypeScript checks, frontend lint, and production build where safe.
- Run backend integration tests and browser workflows that mutate data only against a verified isolated database with a clean-data procedure.
- Exercise representative button journeys in a real browser at desktop and mobile sizes, including Add campus and Add listing; capture console/network failures and verify visible success/error states.
- Re-run focused tests after each fix, then the broader safe suite. Keep the API running at the end if the app can be launched reliably; otherwise report the exact blocker.

## Completion report
Summarize confirmed fixes, button journeys exercised, exact commands/results, lint warnings, any database-backed tests not run and why, and manual test steps. Do not claim production readiness or successful database connectivity without fresh evidence.
