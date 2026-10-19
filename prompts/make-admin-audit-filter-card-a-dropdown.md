# Make the admin audit filter card a dropdown

Update the filter form in `frontend/app/admin/audit-history/page.tsx`.

## Requirements

- Keep all existing admin audit filter controls and behavior: From date, To date, Action category, Apply filters, and Reset.
- Make the filter card a dropdown/accordion: show a compact filter header button when collapsed, and reveal the existing controls only when expanded.
- Keep it collapsed by default on page load.
- Add a clear expand/collapse indicator in the header and use accessible button semantics (`aria-expanded` and `aria-controls`).
- Keep the current validation, loading behavior, and audit filtering semantics unchanged.
- Do not change filtering semantics, API requests, or unrelated files.
- Run `npx tsc --noEmit` and lint the updated page.
