# Align conversation messages by sender

## Problem

In `frontend/app/messages/page.tsx`, the message list is not a flex layout, so the
sender message wrapper's `ml-auto` class does not reliably push it to the right.
Attachment links also use white text on a white background for the current user's
messages, making attachment labels hard to read.

## Implementation

Update the conversation message list to lay out message rows vertically and align
each row based on `message.senderId === user?.id`:

- Current user's messages and attachments align to the right.
- Other participant's messages and attachments align to the left.
- Preserve the existing maximum bubble width, message ordering, timestamps,
  attachment download behavior, responsive layout, and accessible live region.
- Ensure attachment labels remain readable for both sender and receiver; outgoing
  attachment styling must have sufficient contrast.
- Keep the change limited to the messages UI; do not modify API or persistence
  behavior.

## Verification

Run the frontend TypeScript check and lint. If practical, inspect the shared live
Messages page with both student and landlord accounts to confirm outgoing bubbles
are right-aligned and incoming bubbles are left-aligned, including attachments.

## Acceptance criteria

- For either participant, their own messages and attachment rows appear on the
  right side of the conversation pane.
- Messages from the other participant appear on the left side.
- Message text and attachment labels are readable in both directions.
