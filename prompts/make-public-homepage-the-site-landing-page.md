# Make the public homepage the site landing page

## Goal

Ensure a visitor who opens the site root URL (`/`) lands on the public
accommodation homepage shown in the user-provided screenshot, rather than the
login page.

## Expected experience

- Visits to `/`, whether signed out or authenticated, show the public homepage
  with the campus-hero section, campus-aware search form, and summary content.
- Signed-out visitors see Home, Find Accommodation, Log In, and Register in the
  public header. Authenticated visitors see the same public header with their
  existing account actions.
- Keep the page responsive and retain its existing live API-backed institution,
  campus, and approved-listing data; do not replace it with mock data.
- Keep existing sign-in/register routes and post-login redirects to
  role-specific dashboards.
- Do not redirect an already authenticated visitor away from `/`; direct root
  visits and the brand/Home links must continue to show the public homepage.
- Keep the existing search submission behavior, including safe sign-in
  redirection when an unauthenticated visitor submits the search form.
- Ensure direct navigation/reload at `/` works and does not route guests to
  `/login`.

## Scope

- Inspect the homepage, shared public navigation, and route/auth redirects.
- Make only the changes needed to meet the behavior above. Do not redesign the
  screenshot-matching page or change unrelated listing/auth flows.

## Validation

- Run frontend lint and TypeScript/build checks relevant to touched files.
- Verify a signed-out direct visit to `/` displays the public homepage and its
  header/navigation.
- Verify logged-in users remain on the public homepage at `/`, while a fresh
  successful login still routes to the appropriate role dashboard.
- Verify submitting search while signed out retains its sign-in redirect.
- Run `git diff --check`.
