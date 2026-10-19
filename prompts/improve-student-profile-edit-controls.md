# Improve student profile editing controls

On `/student/profile`, add a clear Edit button for the profile information
(name, email, and phone). Keep these fields read-only until Edit is activated,
then allow editing and show Edit and Save buttons together on one horizontal
line; after a successful save, return fields to read-only. Preserve existing
validation, API integration, and explicit error/success feedback. Change the
profile-picture file chooser presentation so “Choose file” is an orange button
that opens the existing file input; keep the selected filename visible and
retain the upload flow. Ensure keyboard accessibility and responsive layout.
Verify frontend lint and TypeScript checks.
