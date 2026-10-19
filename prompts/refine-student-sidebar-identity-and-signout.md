# Refine student sidebar identity and sign out

Update `frontend/components/app-shell.tsx` to improve the student sidebar's identity
typography and spacing:

- Increase the Abode wordmark size in the student identity area.
- Increase the signed-in user's name and Student role text sizes, render both in black/
  charcoal, and use even vertical spacing between the brand, name, and role.
- Keep the expanded identity region ending where it currently does, above Dashboard;
  preserve the navigation order and current desktop/mobile behavior.
- Keep Sign out in its own full-width/easy-to-see row immediately above the footer.
  Ensure its text and icon have sufficient contrast on the light student sidebar and
  preserve the existing admin appearance and logout behavior.
- Preserve landlord/admin identity and navigation appearance except for any shared sign
  out adjustment needed to retain contrast.

Verify student sidebar typography and spacing at desktop and mobile widths, confirm Sign
out remains directly above the footer and clickable, and run frontend TypeScript and
targeted ESLint checks.
