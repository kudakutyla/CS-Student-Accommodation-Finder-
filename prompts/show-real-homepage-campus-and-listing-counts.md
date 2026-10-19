# Show Real Homepage Campus and Home Counts

Replace misleading homepage zeros with explicit, database-backed public totals for active campus communities and approved accommodation listings.

## Findings

- The homepage currently uses `campuses.length` and the returned `listings.length` for its statistic cards.
- The listing request is limited to three results, so its length is not the total approved-home count.
- In the shared browser, the public API calls currently return empty arrays (200); in the backend configured database, read-only queries return 19 active campuses and 29 approved listings.
- Do not hardcode those observed values or add mock data.

## Implementation

- Add a small public aggregate API contract that returns only active campus count and approved listing count from the database. Use existing backend route/controller/response conventions, and document the endpoint in `AGENTS.md`.
- Keep public counts limited to campuses under active institutions and approved listings only; do not expose account, landlord, or moderation data.
- Add a typed frontend API helper and use it on the public homepage for the two counters, independent of the featured-listing sample query.
- Render a brief loading state until the totals load and a clear unavailable state/retry action on failure; do not present a failed request as `0`.
- Keep the three-card featured listing query and homepage content API-backed; no sample values or static count fallbacks.
- Investigate the observed browser-vs-configured-database discrepancy. Confirm the app is calling the intended configured backend and verify the endpoint reports database totals in the shared browser. Do not change API hosts or database configuration without confirming the actual intended environment.
- Add focused backend tests for the count query and active/approved filters.

## Validation

- Verify the public stats endpoint returns the live active campus and approved listing totals.
- Verify the homepage displays those totals, not the limited featured-card result count.
- Run focused backend tests, backend/frontend type-checks, focused frontend lint, and `git diff --check`.
- Preserve unrelated worktree changes and do not commit.
