# Fix Invalid Sessions and Campus Visibility

Resolve the repeated `Invalid token. Authentication failed.` errors and restore the expected institution/campus experience without weakening backend authorization.

## Findings

- The local API health endpoint responds successfully.
- The public `GET /api/campuses/institutions` and `GET /api/campuses` endpoints currently return active data (15 institutions and 19 campuses at investigation time).
- Admin institution/campus management endpoints are intentionally protected and require a valid ADMIN session.
- The frontend attaches the stored bearer token to API requests, but a later 401 does not consistently synchronize the invalidation with the in-memory auth context. That can leave authenticated screens displaying retryable errors with a token that cannot work.

## Implementation

- Handle authentication-related 401 responses from requests using a stored bearer token consistently in `frontend/lib/api.ts` and `frontend/lib/auth-context.tsx`.
- Clear the rejected token and cached user, synchronize the in-memory auth state, and let existing route guards return the user to sign-in. Preserve the requested destination where the established route flow supports it.
- Do not treat ordinary invalid-credential login responses as expiration of an existing session; do not introduce automatic retry loops or silently fall back to public/mock data.
- Keep public institution and active-campus reads available without authentication, and keep management reads/writes ADMIN-only. Do not broaden access to inactive or admin-managed campus records.
- Review the landing page and listing filters so successful public data loads remain visible and failures surface a clear, actionable message; ensure authentication failures on protected campus management views do not leave a misleading Retry loop.
- Add/update focused frontend tests if the existing test setup supports auth/API state behavior; otherwise verify the affected flows with the repository's available checks.

## Acceptance checks

- A protected request rejected for an invalid/expired bearer token clears the stale client session and redirects the user to sign-in instead of repeatedly offering a retry with the same token.
- Invalid login credentials still display the login error and do not trigger unrelated session invalidation.
- Public institution/campus endpoints and corresponding public UI continue to load active records without a token.
- Admin campus/institution management remains restricted to authenticated administrators.
- Run the relevant frontend type-check/lint and `git diff --check`. Preserve unrelated existing worktree changes and do not commit.
