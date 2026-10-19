# Add informative footer and public information pages

## Objective

Expand the global footer with useful About, Safety, Privacy, Terms, and Contact
details while retaining required geographic attribution.

## Implementation

- Update `frontend/app/layout.tsx` with a responsive, accessible footer containing:
  - A concise Abode description.
  - Links to About, Safety and reporting, Privacy notice, and Terms of use.
  - A contact link to `mailto:luluchif97@gmail.com`.
  - The current OpenStreetMap attribution and OSRM routing credit.
  - A copyright notice with the current year.
- Add public static pages at `/about`, `/safety`, `/privacy`, and `/terms`.
- Describe the platform accurately: public listings require administrator
  approval; do not imply that listings or landlords have received checks beyond
  the workflows the app actually performs. Include practical advice to inspect
  accommodation and report concerns through a listing's report action.
- Clearly label Privacy and Terms content as drafts requiring review before
  publication. Use explicit placeholders or "To confirm with Abode" for unknown
  operator identity, data-retention periods, processors, contact procedure,
  governing law, or other policy details. Do not invent legal commitments or
  claim that drafts are final legal advice.
- Keep every page public and preserve existing auth, attribution, and global
  layout behavior.

## Verification

- Run the frontend TypeScript check and lint the changed files.
- Verify all footer links resolve, contact uses the supplied email, and the
  drafts are visibly identified as drafts.
- Verify the responsive footer does not overflow on mobile and attribution
  remains present.
