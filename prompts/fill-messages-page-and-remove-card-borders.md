# Expand the Messages Workspace and Remove Card Borders

Update the authenticated `/messages` page to use the full content area beside
the portal sidebar and fill the available viewport height. Remove the borders
framing the overall conversations/messages card.

## Implementation

- Scope changes to the Messages page and only adjust the shared shell if
  necessary to make the page content fill its available height without
  affecting other routes.
- Remove the centered `max-w-6xl` width constraint and use the available main
  content width with responsive horizontal padding.
- Make the conversation list and active message thread expand to the available
  page height instead of stopping at `60vh`. Keep the message list scrollable
  within the thread and keep the composer accessible at the bottom.
- Remove the outer border around the two-column conversation/messages workspace
  and the borders dividing its columns. Preserve clear visual separation using
  spacing and background/hover/selected states, not replacement card borders.
- Remove the top-level heading divider and the thread header/composer divider
  when they are part of the card framing. Keep controls usable and keyboard
  focus visible.
- Preserve responsive behavior, navigation, conversation selection, loading,
  error/retry, attachments, and send behavior.
- Preserve existing unrelated worktree changes.

## Validation

- Run targeted frontend lint and a frontend production build.
- Review the `/messages` page at desktop and mobile widths if browser preview is
  available; verify the workspace fills the content area and no outer card
  border remains.
- Run `git diff --check`.
