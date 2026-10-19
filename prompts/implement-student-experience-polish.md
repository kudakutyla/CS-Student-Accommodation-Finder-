# Student Experience Polish

Implement the requested student-facing UI and workflow improvements using the existing Next.js, Express, Prisma, and API patterns. Preserve unrelated and pre-existing worktree changes.

## Listing search and accommodation details

- After a student presses **Apply filters**, apply the current filter values and collapse the filter dropdown on mobile and desktop.
- On accommodation detail pages, show a location icon immediately before the address and put the server-provided distance-from-campus value on its own line below the address. Keep this presentation consistent on search and saved-home cards where the address and distance are displayed.
- Replace the numeric average rating format (for example, `3.0 / 5 (1)`) with five stars and the review count. Fill only the whole stars represented by the rating in yellow; leave remaining stars unfilled. Do not show a partial yellow star.
- For the signed-in student's own review, show the message exactly as **“You have already reviewed this listing”** and provide an **Edit** action. Editing must update only the authenticated student's existing review, with backend ownership enforcement and the existing review validation. Provide save/cancel behavior and refresh the displayed review after a successful save.
- Show **“Your review has been submitted.”** directly below the **Student reviews** heading for three seconds after successful submission, then remove it. Do not display this notice in the general page header.
- Match the **Find more accommodation** link color to the listing-price color used for prices such as **R4,200**.
- On the Saved homes page, make **Find more accommodation** a button centered horizontally in the page header area while keeping the Saved homes heading readable and in its existing position. Retain the terracotta price accent as the button's text/border color.

## Reports and notifications

- Move the student reports **Refresh** button to the far right of the **My reports** heading row, with responsive alignment on narrow screens.
- Add a **View** action to each submitted report. It opens an authenticated, student-only report detail page showing the report, listing, status, submitted/updated times, and the admin's status updates and notes.
- Use the existing `Report.adminReviewNote` field to persist the latest admin note whenever an admin updates a report. Keep the existing report-status update and notification behavior.
- Add an optional report reference to report-status notifications and expose it in the notification API response. Create a Prisma migration for this nullable reference and index it.
- Make a report-status notification open the corresponding report detail page, so a student can see the update for that exact report. Keep notification read-state controls and mark the selected report notification read when navigating where practical. Notifications without a report reference retain their existing behavior.
- Add an authenticated `GET /api/reports/mine/:id` endpoint that returns only the current student's report and its listing; return the repository-standard 404 response for missing or non-owned reports. Include the persisted admin note in student/admin report API data as needed.
- Update `AGENTS.md` API contracts for any newly added endpoint or notification/report behavior.

## Authenticated header and dark mode

- On the student dashboard mobile header, show only **Abode** on the left; place the dark-mode toggle and profile icon at the far right in the same row, and do not show the student's name or role in this compact header. Keep the identity in the navigation drawer/sidebar.
- On other authenticated layouts, keep the profile action at the far right of the header, linking to the current user's role-appropriate profile, and retain access to the current avatar/name where present.
- Add a site-wide dark-mode toggle accessible on public and authenticated views. Persist the user's choice across reloads, use the existing design tokens where possible, and ensure text, surfaces, borders, form controls, navigation, and feedback states remain legible in dark mode. Keep light mode as the default for users without a saved preference.

## Messages layout

- Refine the messages screen into a WhatsApp-inspired, responsive inbox: conversation list with participant/listing context and recent-message preview; a clearly identified conversation header; readable incoming/outgoing message bubbles; and a composer anchored at the bottom of the active conversation.
- On mobile, show the conversation list when no conversation is selected and show the active conversation with a back-to-inbox action after selection. Preserve support for opening a conversation from the existing query parameter, sending messages, attachments, and marking messages read.
- Keep all messages and conversations API-backed. Do not add mock conversation data, polling, websockets, or other real-time infrastructure.

## Quality and validation

- Follow existing route/controller/middleware separation, API response conventions, authentication guards, and visual patterns. Do not weaken backend authorization.
- Add or update focused frontend/backend tests for review ownership and updates, report ownership/details and admin-note persistence, notification report linking, and other changed business behavior where covered by the existing test setup.
- Run the relevant frontend type-check/lint and targeted backend tests, Prisma validation/generation as appropriate, and `git diff --check`.
- Do not commit changes.
