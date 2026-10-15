# Fix login CORS for the deployed Vercel frontend

## Evidence

- The deployed login page is hosted at
  `https://cs-student-accommodation-finder-mbc.vercel.app`.
- Its published JavaScript bundle correctly targets
  `https://backend-sfpe.onrender.com/api`.
- The Render API health endpoint responds successfully.
- An auth preflight from the deployed frontend receives HTTP 204 but no
  `Access-Control-Allow-Origin` header, so the browser blocks login requests.
- Backend CORS currently allows the prior Vercel origin in code and
  `render.yaml`, not the deployed `-mbc` origin.

## Implementation

- Allow the deployed `https://cs-student-accommodation-finder-mbc.vercel.app`
  origin in backend CORS while preserving the existing production and local
  development origins.
- Set the Render Blueprint `CLIENT_URL` to the deployed frontend origin.
- Keep the release operations documentation consistent with the production
  origin and deployment requirement.
- Update CORS tests to assert access for both production Vercel origins and
  continued rejection of unrelated origins.
- Do not inspect, print, change, or commit `.env` files or secret values.

## Validation and deployment

- Run the focused CORS test, backend TypeScript check, and `git diff --check`.
- Explain that the backend must be redeployed with the new configuration before
  the browser login request can succeed.
- Verify after deployment that the deployed Vercel origin receives the
  `Access-Control-Allow-Origin` response header on login preflight.
