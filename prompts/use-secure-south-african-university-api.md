# Use an HTTPS university directory for institution suggestions

## Goal

Let administrators find South African universities dynamically while adding an
institution, using a reliable HTTPS API rather than a hardcoded list or the
HTTP-only Hipolabs endpoint.

## Provider

Use the OpenAlex Institutions API from the backend:

`https://api.openalex.org/institutions`

Filter results to South Africa and education institutions
(`country_code:ZA,type:education`) and request a bounded page containing the
South African education catalog with only the fields needed to display
suggestions. Filter the returned institution names against the administrator's
input on the backend. This preserves substring matching for short partial input
such as `ts`; OpenAlex's search endpoint may return no match for such fragments.
The provider has been verified to return the South African education catalog
over HTTPS.

## Existing behavior and constraints

- Suggestions are requested through the admin-protected
  `GET /api/campuses/institutions/suggestions` backend endpoint.
- Selecting a suggestion fills the institution form; only the administrator's
  explicit save creates a persistent institution.
- Student institution/campus selectors must continue using the persisted
  application catalog, not transient provider results.
- Keep provider calls server-side. Do not send auth tokens or other user
  credentials to OpenAlex.
- Keep the existing API response envelope, bounded search input, timeout,
  bounded result count, explicit errors, and admin authorization.
- Normalize provider `display_name`, South Africa country details, and a valid
  homepage hostname (when present) into the existing suggestion response shape.
  Validate upstream JSON and do not expose the full OpenAlex records.
- Return only education institutions; do not include healthcare, company, or
  other organization types.
- Do not add a static list or convert a provider failure into an empty success.

## Implementation

1. Replace the Hipolabs HTTP lookup with a backend HTTPS OpenAlex request.
   Construct query parameters using `URL`/`URLSearchParams`; require at least
   two trimmed search characters and keep the upstream page size bounded.
   Request all current South African education records within that bound (the
   verified catalog contains fewer than 100) and apply case-insensitive
   substring matching against `display_name`.
2. Validate the OpenAlex response structure and each suggestion's required
   name and South Africa country code. Safely derive optional homepage domains
   only from valid URLs. Map records into the existing response fields.
3. Preserve timeout and distinguish unavailable upstream/network responses
   from invalid provider payloads using the project's API error conventions.
   Do not log credentials or return provider payloads in errors.
4. Update the focused tests to verify the HTTPS host, South Africa and
   education filters, field selection/page bound, substring matches for short
   input, normalization, invalid input and payload, network/timeout/HTTP
   errors, and result cap.
5. Keep the existing frontend retry/loading/error behavior and database-backed
   Institution → Campus behavior unchanged unless a directly related bug is
   exposed.

## Validation

- Verify live HTTPS OpenAlex requests return South African education
  institutions for a matching query.
- Run focused backend tests, backend build/type-check, admin page lint, and
  `git diff --check`.
- Confirm no browser-side provider call or hardcoded institution fallback is
  introduced.
