# Fix Render Prisma client generation before backend compilation

## Problem

The Render deployment log runs `npm install && npm run build`, and TypeScript
fails because the generated Prisma client does not expose
`passwordResetToken`. The committed Prisma schema and migration contain the
`PasswordResetToken` model/table, and the auth controller uses it for the
existing password-reset workflow.

## Requirements

- Make the backend `npm run build` command generate Prisma Client from
  `backend/prisma/schema.prisma` before running TypeScript compilation. This
  must work with the exact `npm install && npm run build` sequence shown in the
  deployment log and without requiring a database connection.
- Keep the existing password-reset API behavior and Prisma schema/migration;
  do not remove reset-token usage or introduce a new schema change.
- Update `render.yaml` to avoid redundant Prisma Client generation while keeping
  its clean install and build steps.
- Do not modify unrelated dependencies or attempt to remediate npm audit
  findings in this change.

## Validation

- Run Prisma client generation followed by the backend TypeScript build.
- Run the targeted password-reset backend tests.
- Run `git diff --check`.
