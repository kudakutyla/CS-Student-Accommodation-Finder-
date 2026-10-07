# Fix Render backend TypeScript build

## Context

Render's backend build fails with TS7016/TS2580 errors for Express, JWT, Multer,
Node.js globals, and Node built-in modules. The backend already declares
`@types/express`, `@types/jsonwebtoken`, `@types/multer`, and `@types/node` in
`devDependencies`; the lockfile includes them, and a local install resolves them.
The repository does not currently include Render deployment configuration.

The likely root cause is a Render install/build configuration that omits
development dependencies before running the TypeScript compiler. Do not add
duplicate ambient declarations or move compile-time type packages to production
dependencies as a workaround.

## Implementation

1. Add a Render Blueprint configuration for the backend that explicitly installs
   development dependencies during the build (`npm ci --include=dev`), generates
   Prisma Client with the existing script, runs `npm run build`, and starts the
   built service with `npm start`.
2. Keep runtime dependencies and compile/test tooling correctly classified in
   `backend/package.json`; do not modify dependency versions unless validation
   demonstrates a lockfile issue.
3. Update `RELEASE-OPERATIONS.md` with the Render build/start commands and note
   that a pre-existing dashboard-configured service must adopt the same build
   command (or be configured to use the Blueprint). Do not add secret values;
   preserve backend-only environment variable handling.
4. Verify a clean backend install/build using the lockfile, then run the
   repository's focused backend test if feasible.

## Acceptance criteria

- A clean install using the documented Render build command resolves all
  declared type packages, generates Prisma Client, and compiles the backend
  without TS7016/TS2580 errors.
- Runtime start remains `npm start` and uses the existing generated `dist`
  output.
- No application behavior, dependency classifications, or secrets are changed
  unnecessarily.
