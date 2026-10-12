# Add all Tshwane University of Technology campuses

## Goal

Make TUT campus options available to students and accommodation providers by
adding institution-linked records for the university's campus locations.

## Implementation

- Confirm the TUT campus list against authoritative campus information and
  OpenStreetMap; include all named TUT locations in scope (Pretoria, Arcadia,
  Ga-Rankuwa, Soshanguve North and South, Mbombela, Polokwane, and eMalahleni,
  if verified as current campuses).
- Reuse the existing Tshwane University of Technology institution record and
  existing TUT campus records. Do not create duplicate campus names.
- Link existing legacy TUT campuses to the institution, and activate existing
  official TUT campuses so they are selectable; preserve their coordinates
  unless a verified address geocode is available and a correction is needed.
- Add only newly verified campus locations. Resolve their addresses and
  coordinates through the existing server-side Nominatim geocoder, and do not
  invent addresses or coordinate values. Report any campus whose location
  cannot be verified rather than creating a guessed record.
- Make the import idempotent and non-destructive. Do not run the general seed,
  which clears database data.
- Add/extend focused importer tests for duplicates and existing-campus
  activation/linking, and document the import command if changed.

## Validation

- Verify the target institution, campus names, active state, and links in the
  configured database.
- Confirm every imported coordinate was resolved server-side for the matching
  campus locality.
- Run relevant backend tests, TypeScript check, and `git diff --check`.
