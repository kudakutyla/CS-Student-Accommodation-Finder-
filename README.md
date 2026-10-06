# Student Accommodation Finder

A full-stack platform for discovering administrator-approved accommodation near campus, managing landlord listings, and supporting student enquiries and safety reports.

## Applications

- `backend/`: Express, TypeScript, Prisma, and PostgreSQL API.
- `frontend/`: Next.js App Router application.

## Local Development

1. Install dependencies in both `backend/` and `frontend/` with `npm install`.
2. Copy `backend/.env.example` to `backend/.env` and provide a development/test PostgreSQL URL, direct URL, and a private JWT secret. Copy `frontend/.env.example` to `frontend/.env.local` and set the API base URL.
3. Generate the Prisma client with `npm run prisma:generate` from `backend/`.
4. Start the API with `npm run dev` from `backend/` and the web app with `npm run dev` from `frontend/`.

Never use production credentials for local development or tests. The seed script deletes existing records and is suitable only for disposable data. See [RELEASE-OPERATIONS.md](RELEASE-OPERATIONS.md) for environment, database, test, and deployment safety notes.

## Verification

The Prisma-mocked workflow tests can run without a database from `backend/`:

```sh
npx jest tests/student-workflows.unit.test.ts --runInBand
npx tsc --noEmit
```

From `frontend/`, run `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Existing database integration tests require a separately provisioned isolated test database.
