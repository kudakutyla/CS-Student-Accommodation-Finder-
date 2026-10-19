# Fix Student Dashboard Campus and Listing Images

Ensure the student dashboard's **Popular campuses** and **Recommended for you** sections render useful, visible imagery when the live API supplies records, while reporting empty or failed data requests clearly.

## Findings

- The dashboard loads campuses and listings together with `Promise.all`; one failed request prevents both sections from rendering their successfully fetched data.
- Campus cards currently use a gradient background with an institution logo/initials, not a campus-photo fallback. Local campus images already exist under `frontend/public/images`.
- Recommended listing cards use the shared `ListingImage` component, which already handles uploaded photos and a local fallback image.
- The dashboard API is database-backed; never add mock campuses, listings, or property content to hide missing API data.
- The browser preview currently lacks a valid session, while the configured local database contains active campuses and approved listings. Preserve protected access and the API's approved-listing-only behavior.

## Implementation

- Load campus and recommendation data independently so a failure in one section does not suppress successful data in the other.
- Give each section explicit, helpful loading, empty, and retryable error states. Do not imply “0” records when a request failed.
- Add an attractive cover image to Popular campuses cards using existing local campus photography as a decorative fallback; preserve real campus/institution names, active status, result links, listing counts, and the institution logo/initials fallback.
- Keep Recommended for you strictly backed by approved API listings. Ensure real uploaded listing photos render and use the existing shared image fallback only when a listing photo is absent or fails. Do not create fabricated listing cards.
- Keep responsive layout, dark-mode contrast, accessibility text, and retry behavior consistent with surrounding student UI.
- Investigate and address any dashboard-specific API/auth loading issue revealed during implementation without weakening endpoint authorization or falling back to mock data.

## Validation

- Run frontend type-check and focused ESLint for changed files, plus `git diff --check`.
- Verify with live records that campus cards show cover images and recommended cards show actual listing photos/fallbacks.
- Verify a failed/empty campus request does not hide successfully loaded approved listings, and vice versa.
- Preserve unrelated worktree changes and do not commit.
