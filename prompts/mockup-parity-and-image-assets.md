# Mockup Parity and Local Images

## Objective
Bring the existing Student Accommodation Finder UI closer to the supplied Figma Make prototype and ensure real accommodation imagery appears reliably. Preserve the real Next.js/Express/Prisma application; do not replace it with the prototype's mock data.

## Reference findings
- The live Figma Make prototype is at the user's supplied document URL. Its public screen has a full-height campus/property photograph, a simple Abode header, a large serif headline and supporting copy on the left, and a floating white search panel on the right with campus, accommodation type, monthly budget, and a Search Now action.
- The student experience uses a light sidebar, compact metric tiles, image-led recommended listings, and recent activity.
- The landlord portal uses a light, warm sidebar, a verification badge, a compact listing/status dashboard, and listing imagery.
- The admin console uses a charcoal sidebar and dense operational statistics, pending actions, and audit history.
- The attachment folder includes six 600x400 JPEG photos with no extensions: `photo-1541194577687-8c63bf9e7ee3`, `photo-1579632151052-92f741fb9b79`, `photo-1628592102751-ba83b0314276`, `photo-1663756915304-40b7eda63e41`, `photo-1738168246881-40f35f8aba0a`, and `photo-1738168279272-c08d6dd22002`.
- The current homepage uses external Unsplash URLs, current role pages share the public navbar, and a prior safe browser run showed the listings/campuses API returning 500 because Prisma could not find `public.Campus` and `public.Listing`. Database/environment work is separate and must not be mixed into this visual task.

## Required workflow and safety
1. Read root `AGENTS.md` and `frontend/AGENTS.md`, inspect current diffs and worktree before editing, and preserve all existing user changes.
2. Follow the installed Next.js 16 image guidance. Use local assets from `frontend/public` for prototype imagery; do not rely on remote Unsplash URLs for essential visuals.
3. Do not read, print, modify, or expose `backend/.env` values. Do not connect to Neon, run Prisma commands, seed data, or write database state for this task.
4. Do not add mock accommodation listings or fictitious database-backed values to hide API failures. Keep loading, empty, and API error states explicit; use local imagery for visual/empty-state presentation only.
5. Preserve server-side role authorization and existing route/API contracts. Do not implement the prototype's role switcher as a way to change real user roles; authenticated users continue to use the existing role-aware routing.

## Implementation scope
- Public homepage: match the Figma hero composition at desktop and mobile widths, use a supplied local property/campus image as the full-bleed hero, keep the search form's campus/type/budget controls connected to the real listings route, and retain useful navigation and live API content sections below the hero.
- App shell: keep the public navigation for public routes; provide role-appropriate portal chrome for authenticated student, landlord, and admin routes using links to routes that actually exist. Distinguish student/landlord warm light navigation from the admin charcoal console. Keep keyboard access, active route indication, sign-out behavior, and mobile navigation usable.
- Primary dashboards: align the student, landlord, and admin dashboard hierarchy, metric density, section spacing, and real listing imagery with the Figma views without replacing their API-backed data or action handlers.
- Images: copy the supplied JPEG assets into `frontend/public` with `.jpg` extensions and meaningful stable names. Use optimized local Next.js images where appropriate. Add stable aspect ratios, descriptive alt text for informative photos, decorative empty alt for decorative backgrounds, and a local fallback when a listing photo is absent or fails. Do not leave broken remote image dependencies in the hero or fallback slots.
- Keep Add Listing, campus administration, authentication, search/filter/reset, moderation, and other existing controls wired to their current APIs and actions. Do not redesign unrelated workflow semantics.

## Validation
- Run frontend TypeScript, ESLint, and production build after the edits.
- Start the frontend dev server and verify the home, listings, student, landlord, and admin views at desktop and mobile widths with browser screenshots.
- Verify the hero and supplied asset URLs load locally; test the public search navigation and primary role navigation without database writes.
- Confirm local-image fallbacks do not invent listing records when the API is unavailable. Clearly report API-backed workflows not verified due to the separate missing-schema issue.

## Completion report
Summarize touched UI routes, which local images are used, screenshots/viewports checked, exact validation results, and any data-backed visuals/actions blocked by API errors. Preserve and disclose pre-existing worktree changes; do not claim full database functionality from UI-only checks.
