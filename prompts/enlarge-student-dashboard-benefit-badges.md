# Enlarge and unify student dashboard benefit badges

In `frontend/app/student/dashboard/page.tsx`, make “Verified listings”, “Near campus”,
and “Secure options” more prominent by increasing their text size and padding. Give all
three badges the same background color currently used by “Verified listings”
(`var(--beige)`) and retain a consistent badge shape and readable contrast.

Keep their existing order and horizontal layout where space allows; avoid mobile
horizontal overflow. Do not alter the dashboard card or unrelated elements.

Run frontend TypeScript and targeted ESLint checks, and verify the badges at mobile width.
