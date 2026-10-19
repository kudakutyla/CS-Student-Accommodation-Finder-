# Remove report update cards from the student reports page

On the `/student/reports` page, remove the section that lists admin report-status
notifications, including each “Your report was reviewed” card and its “View all
account updates” link. Keep the submitted reports list, its status/details, and
the separate notification center at `/notifications` unchanged. Preserve explicit
report-loading error handling; remove notification fetching/state only if it is
no longer used by this page. Verify the student reports page no longer displays
the report update cards and that submitted reports still render.
