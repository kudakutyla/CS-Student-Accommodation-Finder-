# Align admin sidebar, filter bars, and notification destinations

## Admin sidebar

Match the administrator sidebar's desktop and mobile layout geometry to the
student sidebar in `frontend/components/app-shell.tsx`: larger Abode wordmark,
prominent signed-in administrator name and role, spacing, navigation text/icon
sizes, and full navigation list below the identity block. Keep the admin dark
color theme, admin links/order, active state styling, and sign-out/footer
behavior unchanged. Student and landlord layouts must remain unchanged.

## Filter bars

On `frontend/app/admin/pending-listings/page.tsx` and
`frontend/app/admin/audit-history/page.tsx`, present all existing filters and
their clear/apply actions as a single horizontal toolbar on desktop. Keep
labels, values, date validation, filtering behavior, and reset/clear behavior.
At narrow widths, allow clean wrapping/stacking without horizontal overflow.

## Notification destinations

Make notification items navigate to their associated report or listing, with
correct role-aware destinations:

- Admin `NEW_REPORT` notification: navigate to the specific report in
  `/admin/reports?reportId=...`.
- Admin notification for a newly submitted pending listing: navigate to that
  listing in `/admin/pending-listings?listingId=...`. Create this notification
  for active admins after a listing is successfully submitted.
- Student `REPORT_STATUS` notification: preserve its current destination to
  the student's own report and admin updates.
- Landlord `LISTING_APPROVED` / `LISTING_REJECTED` notification: navigate to
  that landlord's listing.
- Do not break `NEW_MESSAGE` notifications; link them to Messages when a
  conversation/listing destination is not available.

Persist optional `listingId` on Notification with a Prisma schema update,
idempotent SQL migration, and appropriate index/foreign-key behavior. Populate
`reportId` on new admin report notifications and `listingId` on pending-listing
and listing-status notifications. Keep all reads/writes scoped to the
authenticated user. If notifying admins after listing submission fails, do
not report that the already-created listing failed; preserve the successful
submission result and surface a notification warning.

For query-targeted admin reports and pending listings, bring the referenced
record into view after data loads and make it visually apparent. Preserve
existing moderation permissions and business rules. Do not apply migrations
to the configured database automatically.

Add/update focused backend tests for notification identifiers and safe
submission behavior. Run relevant backend tests, backend/frontend TypeScript
checks, and frontend lint.
