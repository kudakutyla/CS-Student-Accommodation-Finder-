# Add the University of Fort Hare logo to its campuses

Update `frontend/lib/institution-logos.ts` so campuses associated with the University of Fort Hare display the institution's logo through the shared official-logo resolver used by the student dashboard.

## Requirements

- Add the official University of Fort Hare logo using a verified, direct image URL hosted by the university where available.
- Match the institution's canonical name and reasonable existing name variants only if the data currently uses those variants.
- Do not hard-code campus names individually: the same institution logo should resolve for every University of Fort Hare campus.
- Preserve admin-managed `institution.logoUrl` precedence and the existing graceful initials fallback when the image is unavailable.
- Do not change campus background-photo mappings, database records, or unrelated institution logos.
- Run frontend TypeScript validation and lint.
