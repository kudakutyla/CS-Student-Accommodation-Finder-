# Zoom Out the Hero Photo, Support Multiple Property Photos, and Separate Messages

Make three focused UI improvements while preserving existing uncommitted work:

1. Show more of the real campus building photo on the homepage hero.
2. Make adding multiple property photos clear and reliable in the landlord
   accommodation form.
3. Add a visual separator between the conversation list and message thread.

## Homepage hero

- Keep the existing real campus building photo; do not substitute an
  unsourced/fictional image or add video/animation.
- Zoom out the framing so more of the full building and grounds are visible
  instead of cropping the image as tightly as the current `object-cover`
  treatment.
- Preserve legible hero text and search form across desktop and mobile widths.
  If displaying the full image leaves unused space, fill it with a restrained
  treatment derived from the same image rather than blank bars.

## Landlord property-photo upload

- The backend already accepts up to eight JPEG, PNG, or WebP photos, and the
  create form already uses a `multiple` file input. Preserve this contract.
- Improve the form so landlords can add several photos at once and add more
  photos in subsequent selections without replacing the photos already chosen.
- Keep per-photo previews and removal working. Revoke object URLs when a photo
  is removed or replaced, on form unmount, and when a selection is rejected.
- Enforce the existing maximum of eight photos visibly; do not silently discard
  overflow selections. Preserve the requirement to include at least one photo
  and the existing 5 MB per-file/server validation.
- Continue submitting each file as a separate `photos` multipart field.

## Messages

- Keep the full-width, borderless workspace from the recent Messages update.
- Add a subtle responsive divider between the conversation/user list and the
  message thread (vertical on desktop, horizontal when stacked on mobile).
- Do not restore the overall card outline or change message behavior.

## Validation

- Run targeted frontend lint and a frontend production build.
- Verify `git diff --check`.
- If practical, visually check the homepage framing, multi-selection/add-more
  photo flow, and Messages divider at desktop and mobile widths.
