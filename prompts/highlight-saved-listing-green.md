# Highlight Saved Listing State in Green

On the student listing detail page, make the save control visibly green while
the apartment is saved, matching the existing `Saved` label/state.

- Update the `Save home` / `Saved` button in
  `frontend/app/listings/[id]/listing-detail.tsx`.
- When `isFavourite` is true, give the button a clear green background and
  contrasting readable text/icon. When false, preserve the current neutral
  outlined appearance.
- Preserve the current save/unsave request flow, accessible button text, busy
  behavior, and error handling. The button should turn green only after the
  save request succeeds and return to neutral only after a successful removal.
- Do not change saved-home card contents or unrelated listing behavior.

Validate with targeted frontend ESLint, TypeScript checking or production
build, and `git diff --check`. Verify both saved and unsaved visual states.
