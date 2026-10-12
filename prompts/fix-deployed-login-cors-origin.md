# Fix login CORS for the deployed Vercel frontend

## Evidence

- The deployed login page is hosted at
  `https://cs-student-accommodation-finder-mbc.vercel.app`.
- Its published JavaScript bundle targets
  `https://backend-sfpe.onrender.com/api`.
- The Render API health endpoint responds successfully.
- An auth preflight from the deployed frontend receives HTTP 204 but no
  `Access-Control-Allow-Origin` header, so the browser blocks login requests.
- Backend CORS and the Render Blueprint used the previous Vercel origin rather
  than the deployed `-mbc` origin.

## Implementation

- Allow the deployed `https://cs-student-accommodation-finder-mbc.vercel.app`
  origin in backend CORS while preserving the existing production and local
  development origins.
- Set the Render Blueprint `CLIENT_URL` to the deployed frontend origin.
- Keep release operations documentation consistent with the production origin.
- Update CORS tests to assert access for both production Vercel origins and
  continued rejection of unrelated origins.
- Do not inspect, print, change, or commit `.env` files or secret values.

## Validation and deployment

- Run the focused CORS test, backend TypeScript check, and `git diff --check`.
- The backend must be redeployed with the new configuration before browser
  login requests can succeed.
- After deployment, verify that the frontend origin receives the
  `Access-Control-Allow-Origin` header on login preflight.
