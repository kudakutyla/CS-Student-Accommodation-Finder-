# Diagnose Render-hosted Nominatim address lookup failures

## Goal

Make the hosted admin campus address-suggestions failure actionable when the
public OpenStreetMap Nominatim service rate-limits a request or is unavailable.
The current API response, `OpenStreetMap address lookup is busy or temporarily
unavailable. Try again later.`, is returned for upstream HTTP 429 and 5xx
responses, but does not tell an operator which status occurred.

## Scope

- Keep campus address lookup server-side through the existing Nominatim
  integration. Do not add a Nominatim API key requirement or switch providers.
- Log the upstream HTTP status and any safe retry-delay metadata for Nominatim
  429/5xx responses so the Render service logs can distinguish rate limiting
  from provider/server outages.
- Do not log the searched address, full request URL, credentials, or other
  potentially sensitive user input.
- Preserve the existing API response shape, HTTP status, and generic
  user-facing error. Do not expose provider response bodies or internals to
  clients.
- Do not automatically retry 429/5xx responses or fall back to another
  provider/coordinates. Keep the existing serialized one-request-per-second
  Nominatim behavior.
- Update `RELEASE-OPERATIONS.md` with the exact interpretation of the error,
  where to inspect the Render backend logs, and the limitation that this
  in-memory throttle is per backend process and does not coordinate multiple
  instances. Recommend keeping one instance for this public service or moving
  to a self-hosted/contracted provider before scaling.
- Add focused backend tests for 429 and 5xx logging, confirming the address
  query is not logged and the existing 503 response behavior is preserved.

## Validation

- Run the focused backend geocoding and campus-suggestions unit tests.
- Run the backend TypeScript build/check.
- Run `git diff --check`.
- Share operational test steps: deploy the change, repeat the admin address
  suggestion request, and inspect Render logs for the upstream status if the
  public service still rejects it.
