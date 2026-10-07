# Fix backend start entrypoint

## Problem

The backend TypeScript build succeeds, but the deployed service exits at startup
because `npm start` runs `node dist/server.js`, which does not exist. With
`rootDir` set to the backend root and `src/server.ts` included, TypeScript emits
the file at `dist/src/server.js`.

## Implementation

Update the backend package entrypoint and start script to consistently reference
the emitted `dist/src/server.js` file. Keep the compiler output layout unchanged;
avoid moving source files or broad TypeScript configuration changes. Update any
directly related documentation only if it references the old output path.

## Verification

Run the backend build, verify the expected output file exists, and run the
backend test suite or the focused workflow test. Do not run the server against
production services as part of validation.

## Acceptance criteria

- `npm run build` emits `backend/dist/src/server.js`.
- `npm start` resolves the emitted entrypoint rather than `backend/dist/server.js`.
- Existing backend behavior and test results remain unchanged.
