# Use the app branch to fix the localhost 404

## Goal

Run the actual Student Accommodation Finder instead of the default Next.js
starter page currently present on `master`.

## Evidence

- The current worktree is on `master` at commit `949b586`.
- `master` contains only the default Next.js `frontend/app/page.tsx` and has no
  `/landlord/listings` route.
- Local branch `main` contains the complete accommodation application,
  including landlord listing routes, and its backend `.gitignore` already
  includes `/uploads/`.
- The currently shared browser URL, `http://localhost:3000/landlord/listings`,
  returns 404 because of this branch mismatch.

## Implementation

- Switch the current worktree from `master` to the existing local `main`
  branch. Do not merge, rebase, reset, cherry-pick, commit, or push.
- Preserve all existing untracked prompt files and other unrelated workspace
  files. Check for path collisions before switching; do not overwrite them.
- The selected `main` branch already contains the backend `/uploads/` ignore
  rule, so do not transfer unrelated local edits unless needed to preserve
  uncommitted user work.
- Verify `frontend/app/landlord/listings/page.tsx` exists on the checked-out
  branch and start/restart the frontend with `frontend/` as the working
  directory.
- Confirm `http://localhost:3000/landlord/listings` responds with the
  application rather than the Next.js 404, and leave the service running if
  supported by the existing VS Code task setup.
- Do not modify app source files unless the route still fails after the branch
  correction; if it does, stop and report the evidence before broad changes.

## Validation

- Verify the current branch is `main`.
- Verify the landlord listings route exists.
- Confirm the local route returns HTTP 200 and renders the accommodation app.
- Preserve unrelated changes and confirm no merge conflicts were introduced.
