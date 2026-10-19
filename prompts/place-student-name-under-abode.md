# Place student name directly under Abode

Update the student identity layout in `frontend/components/app-shell.tsx` for desktop and
the mobile drawer:

- Move the signed-in name and Student role so they begin immediately beneath the Abode
  wordmark, instead of being bottom-aligned within the tall identity area.
- Remove the spacer/auto margin that pushes the name and role down, and keep their
  existing readable font sizes and charcoal color.
- Keep the expanded identity-area height, wordmark position, Dashboard/Find Homes
  positions, mobile menu behavior, and Sign out/footer placement unchanged.
- Do not change landlord/admin sidebar layouts.

Verify the name and role appear directly below Abode on desktop and mobile with no
horizontal overflow. Run frontend TypeScript and targeted ESLint checks.
