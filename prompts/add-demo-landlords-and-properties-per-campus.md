# Add demo landlords and properties near each active campus

## Goal

Populate the database with clearly identified demonstration landlord accounts and
three nearby demonstration property listings for every campus linked to an active
institution and currently marked active. The database currently contains 17 such
campuses; the target is 51 listings if all property locations can be verified.

## Requirements

- Add a safe, idempotent Prisma import command; default to dry-run and require an
  explicit `--apply` flag before writing. Do not use or modify the destructive
  Prisma seed.
- Create one clearly identified demo landlord per campus and assign that landlord
  all three listings for that campus, demonstrating that a landlord can own
  multiple properties. Reuse the same demo landlord on subsequent imports.
- Use reserved `example.test` email addresses for demo accounts, do not print or
  expose credentials, and mark the accounts as verified landlords to satisfy the
  listing ownership requirement. Keep the demo accounts inactive so they cannot
  authenticate as real landlords.
- Clearly label every demo listing in its title and description. Set availability
  to available but approval status to `PENDING`; do not approve listings or make
  them publicly visible.
- Each listing must reference its intended active campus, have valid required
  property fields, and have coordinates and distance calculated by the existing
  server-side geocoding/distance flow. Do not infer coordinates by offsetting a
  campus pin or invent precise street addresses. If three address candidates
  cannot be independently resolved near a campus, report that campus and avoid
  writing incomplete listings.
- Keep per-campus counts idempotent: rerunning the importer must not add duplicate
  demo landlords or listings. Do not alter, delete, or reassign existing non-demo
  users, listings, or campus records.
- Add focused tests for dry-run, apply/idempotency, multi-listing ownership,
  pending-only visibility, and unresolved addresses. Document the command and
  its safety behavior in the README.

## Validation

- Run the focused importer and relevant geocoding tests.
- Run the backend TypeScript check and `git diff --check`.
- After applying, verify active-campus coverage, per-campus counts, landlord
  ownership, and that all imported listings remain pending.
