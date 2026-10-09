# Release and Operations Notes

## Environment

Use the checked-in `backend/.env.example` and `frontend/.env.example` as key lists only. Copy them to local `.env` files and fill values in your local environment; never commit real URLs, passwords, JWT secrets, or tokens. Both backend and frontend `.gitignore` files exclude `.env*`.

Backend variables:

- `DATABASE_URL`: PostgreSQL connection URL used by Prisma's application connection.
- `DIRECT_URL`: direct PostgreSQL connection URL used by Prisma tooling when required by the provider.
- `JWT_SECRET`: private signing secret; use a randomly generated value of at least 32 characters in each deployed environment.
- `PORT`: HTTP listen port (defaults to `5000`).
- `CLIENT_URL`: allowed deployed frontend origin. For production, set this to
  `https://cs-student-accommodation-finder.vercel.app`.
- `NODE_ENV`: set to `production` in the deployed backend.
- `UPLOAD_DIR`: optional private upload path. The default is `backend/uploads`, which is ignored
	by Git; production deployments must mount durable storage at this path.

Frontend variable:

- `NEXT_PUBLIC_API_URL`: public base URL of the deployed API, including `/api`.

If a database credential was exposed, rotate it with the database provider and replace it in local and deployment secret stores. Do not paste replacement values into source control, logs, tickets, or chat.

## Database Changes

The repository now contains recent Prisma migrations for institutions, message attachments, profile pictures, and report review notes, but does not yet have a reviewed production migration baseline. `prisma db push` is suitable only for a deliberately selected development or isolated test database after reviewing the schema diff. It is not a production migration plan and must not be run against a production database as a substitute for reviewed migrations.

Before production use, establish a migration baseline for the existing database, review generated SQL, test forward migration and recovery on a disposable database, and retain a provider backup before applying changes. Never use `prisma migrate reset`, seed scripts, or destructive database commands against production. The seed script deletes existing records and is for disposable development data only.

## Local Commands

From `backend/`:

```sh
npm install
npm run prisma:generate
npm run build
npm test -- --runInBand tests/student-workflows.unit.test.ts
npm run dev
```

From `frontend/`:

```sh
npm install
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

The focused `student-workflows.unit.test.ts` suite mocks Prisma and does not connect to a database. Existing integration tests use the configured database and seeded test accounts; run them only with a separately provisioned, isolated test database and an intentional clean-data procedure. Do not point those tests at production or an everyday shared database.

## Health and Operations

The backend health endpoint is `GET /api/health`. It confirms the HTTP service is responding; it does not prove database connectivity. Add a separately monitored database readiness check before deployment if the hosting platform needs one, taking care not to expose connection details in responses.

Render deployment configuration is in [`render.yaml`](render.yaml). It builds from
`backend/`, explicitly installs development dependencies with `npm ci --include=dev`
then generates Prisma Client before running the TypeScript compiler, and starts
the compiled service with `npm start`. The type packages and compiler remain in
`devDependencies`; they are needed at build time, not runtime. A pre-existing
Render service configured through the dashboard must use the same build command
(`npm ci --include=dev && npm run prisma:generate && npm run build`) and start
command (`npm start`), or be configured to use this Blueprint. The API CORS
allowlist includes the production Vercel origin above; set Render's `CLIENT_URL`
to the same origin and redeploy the backend after changing this setting.

Set the Blueprint's `sync: false` variables in Render's secret store. Do not put
their values in `render.yaml` or source control. Configure durable storage for
`UPLOAD_DIR` before production use, as described above. Select centralized logging
and error-monitoring services during deployment, configure log retention and
alerting, and document a tested database backup and restore procedure. No
production deployment has been performed or verified by this repository change.

Campus and property geocoding uses the public Nominatim service, and route distances use the
public OSRM demo service. These services require no API key but are community-operated, rate
limited, and provide no uptime or production traffic guarantee. The backend identifies itself
to Nominatim and limits geocoding requests to at most one per second per backend process. Keep
traffic low; deployments with multiple backend instances or higher usage should use a
self-hosted or contracted geocoding/routing service before scaling. Do not fall back to
approximate or client-provided coordinates when a lookup fails.

Admin campus suggestions use the authenticated `GET /api/campuses/suggestions?institutionId=...`
endpoint. On an explicit administrator action, the backend queries Overpass for South African
university/college features tagged with the selected institution name or short name as
operator, brand, or name. The list only contains mapped and suitably tagged OpenStreetMap features; it is not an
authoritative or exhaustive campus directory. The administrator reviews and submits the campus
form, and the backend performs its own Nominatim address geocoding before saving. Overpass,
like the public Nominatim service, is community-operated, rate limited, and has no uptime
guarantee; keep queries user-triggered, bounded, and low volume. Attribute OpenStreetMap
contributors wherever geographic suggestions are presented.

Local uploads use a filesystem-backed adapter; production must provide durable storage for
`UPLOAD_DIR` rather than an ephemeral container filesystem.

## Seed Policy

Use `backend/prisma/seed.ts` only against disposable development/test data. It clears relational records before inserting fixtures. Do not run it in staging or production; provision only reviewed, environment-appropriate accounts and data using a separate controlled process.
