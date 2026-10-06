# Restore Authentication and Listing Search

## Objective
Restore real account registration/login and campus/listing search by fixing the backend's verified Prisma database target and provisioning the schema only on the user's explicitly designated disposable development database.

## Confirmed findings
- `GET /api/health` returns HTTP success, confirming the API process is running.
- `GET /api/campuses` and `GET /api/listings` return generic failures; backend logs show Prisma `P2021` because `public.Campus` and `public.Listing` do not exist.
- A read-only diagnostic login request returns the generic login 500; registration controller uses the same Prisma `User` table path and is expected to fail until the database schema exists.
- Current local `DATABASE_URL` and `DIRECT_URL` do not match: the runtime URL is pooled; the direct URL is also pooled and differs in normalized host and password.
- No account creation or schema mutation has been performed during the current diagnostic pass.

## Safety and workflow
1. Read root `AGENTS.md`, review current worktree state, preserve all pre-existing changes, and do not print or copy credentials.
2. The database password was previously shared in chat. Require a rotated credential in the ignored local `backend/.env`; never echo it into command output, this prompt, or tracked files.
3. Require `DATABASE_URL` to be the intended pooled endpoint and `DIRECT_URL` to be that same Neon project's unpooled endpoint, with matching database, username, and rotated password. Verify only boolean component matches.
4. The user has identified this as disposable development Neon and approved schema push in the earlier conversation, but do not proceed until the current local URL-pair verification passes. If it still fails, ask the user to correct the ignored `.env` locally; do not guess or connect to another host.
5. Validate the Prisma schema and inspect a dry-run/schema diff before any write. Never use `--force-reset`, `--accept-data-loss`, `migrate reset`, seed, drop, or destructive commands. If push reports data loss or non-empty conflicting schema, stop and ask before proceeding.
6. Do not add mock-only production data or change auth/search API contracts to conceal database failures.

## Execution after target validation
- Run `prisma db push` only after the checks above pass and only against the explicitly approved disposable dev database.
- Confirm the required tables exist with safe read-only API checks.
- Exercise registration and login with a unique disposable diagnostic identity only if it can be removed safely or the database is confirmed disposable; do not use the user's real email/password.
- Verify campus and listings searches, including type and max-price query filters.
- Run the database-independent backend unit suite, the relevant isolated integration tests, backend/frontend type checks, frontend lint/build, and browser smoke checks.
- Do not claim registration/login/search are fixed until fresh API/browser evidence confirms them.

## Completion report
Report URL validation flags without secrets, schema operation result, exact API/test outcomes, any remaining database or test isolation blockers, and local test steps. Keep the app running if possible.
