# Preselect landlord for property registration

## Objective

When a visitor selects "List your property" on the homepage, open registration
with Landlord selected by default.

## Implementation

- Update the homepage CTA in `frontend/app/page.tsx` to link to registration
  with a role query parameter identifying a landlord.
- In `frontend/app/register/page.tsx`, initialize the role from a validated
  `role` query parameter (`STUDENT` or `LANDLORD`); retain Student as the
  default when the parameter is missing or invalid.
- Keep the role buttons interactive and ensure the selected styling and
  `aria-pressed` state match the initialized role.
- Do not change registration submission behavior or any other links.

## Verification

- Run the frontend TypeScript check.
- Verify clicking "List your property" opens `/register?role=LANDLORD` with
  Landlord selected.
- Verify `/register` and invalid role values still default to Student, and role
  selection can still be changed.
