# Fix deployed authentication CORS

## Confirmed failure

The deployed frontend at `https://cs-student-accommodation-finder.vercel.app`
uses `https://backend-sfpe.onrender.com/api`. Browser requests to both
`/api/auth/register` and `/api/auth/login` fail during CORS preflight because the
backend response does not include
`Access-Control-Allow-Origin: https://cs-student-accommodation-finder.vercel.app`.
The backend currently allows `CLIENT_URL` (if configured) and localhost only.

## Implementation

1. Update the backend's CORS allowlist to explicitly include the exact production
   frontend origin above, while retaining the existing `CLIENT_URL` and local
   development origins. Keep origin matching exact; do not use a wildcard or
   broadly allow arbitrary Vercel preview origins.
2. Add a focused backend test that sends an OPTIONS preflight to an auth route
   with `Origin: https://cs-student-accommodation-finder.vercel.app` and verifies
   the allowed origin and POST/content-type preflight headers. Also verify an
   unrelated origin is not granted an allow-origin header.
3. Update deployment documentation to state that Render `CLIENT_URL` should be
   set to `https://cs-student-accommodation-finder.vercel.app` and that an
   existing Render service must redeploy after the CORS change.

Do not change auth or registration business rules, loosen the CORS policy with
wildcards, or access secrets from local environment files.

## Verification

Run the focused CORS test, backend TypeScript build, and the focused auth
authorization/workflow tests. No production database or credentials are needed.

## Acceptance criteria

- Browser preflight from the deployed frontend is allowed for both login and
  registration.
- An origin outside the configured allowlist is not granted CORS access.
- Existing localhost development and environment-configured client origin
  behavior is preserved.
