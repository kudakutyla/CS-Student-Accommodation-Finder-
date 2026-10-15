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

### Import mapped campuses

To add real OpenStreetMap campus records for active institutions without
deleting existing data, run `npm run campuses:import` from `backend/` for a
dry-run summary. Review the proposed campuses, then explicitly apply them with
`npm run campuses:import -- --apply`. The importer skips existing campus names,
geocodes new addresses server-side, and reports institutions with no mapped
campuses. Do not use `npm run prisma:seed` for this purpose; that seed clears
existing records.

For the reviewed campus records that are already mapped in OpenStreetMap, run
`npm run campuses:catalog-import` from `backend/`. It validates new campus
addresses through Nominatim before writing, adds only missing records, and
links matching legacy campuses to their institutions without changing their
active status. It skips existing records and preserves unrelated database
data.

To prepare demonstration listings near each active campus, run
`npm run properties:demo-import` from `backend/` for a dry-run. Review the
verified nearby OpenStreetMap accommodation locations, then explicitly apply
the import with `npm run properties:demo-import -- --apply`. The importer adds
three clearly fictional, pending listings per campus where three distinct
nearby addresses and OSRM route distances can be verified. Each campus gets an
inactive, verified demo landlord account that owns those listings. Listings
remain unavailable to public search until an administrator approves them;
unresolved campuses are reported and left unchanged. These are test records,
not real accommodation offers. Location data is sourced from OpenStreetMap;
see [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright).
Do not use `npm run prisma:seed` for this purpose; that seed clears existing
records.

## Verification

The Prisma-mocked workflow tests can run without a database from `backend/`:

```sh
npx jest tests/student-workflows.unit.test.ts --runInBand
npx tsc --noEmit
```

From `frontend/`, run `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Existing database integration tests require a separately provisioned isolated test database.
