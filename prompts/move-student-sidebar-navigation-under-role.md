# Move student sidebar navigation under the role label

Update `frontend/components/app-shell.tsx` for the student sidebar:

- Remove the large empty gap after the student identity area. On desktop and in the
  mobile drawer, place Dashboard immediately after the Student label, followed by the
  remaining student links in their existing order.
- Let the identity section size to its content; remove the fixed-height student identity
  spacer while keeping the Abode, signed-in name, and Student label.
- Increase student navigation link text size and icon size consistently. Preserve active
  and hover treatments.
- Keep the mobile menu close behavior, Sign out pinned above the footer, and existing
  landlord/admin layouts unchanged.

Verify the first navigation link begins just below the Student label on desktop and
mobile, all student links remain available, and no horizontal overflow occurs. Run
frontend TypeScript and targeted ESLint checks.
