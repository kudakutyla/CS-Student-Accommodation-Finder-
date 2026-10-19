# Mirror student profile controls on landlord profile

Apply the profile editing and picture-picker controls from the student profile
to the landlord profile page (`frontend/app/landlord/profile/page.tsx`):

- Name, email, and phone fields start read-only.
- Add an Edit profile button. On activation, make those fields editable and
  clear prior detail success/error feedback.
- Keep Edit profile and Save profile settings beside each other on one
  horizontal row, wrapping only when needed for narrow screens.
- Save profile settings remains disabled until editing is enabled and while
  saving; on successful save, update the authenticated user and return the
  fields to read-only. Keep explicit error and success feedback.
- Present the profile picture file input through an orange Choose file button
  and show the selected filename, matching the student profile.

Preserve the landlord page layout, role guard, landlord verification status,
profile-picture preview/upload flow, API integration, and error handling.
Do not change student profile behavior or unrelated screens.

Run frontend lint and TypeScript validation.
