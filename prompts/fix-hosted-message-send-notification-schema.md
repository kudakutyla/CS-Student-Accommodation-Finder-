# Fix hosted message sending schema mismatch

The hosted backend logs Prisma error `P2022`: `Notification.listingId` does not exist.
The repository already contains the additive migration
`backend/prisma/migrations/20261019000000_add_notification_listing_target/migration.sql`.

## Scope

- Inspect the target database and migration history read-only before any change.
- Do not print, log, or expose database URLs, passwords, JWT secrets, or other credentials.
- Do not run `prisma migrate deploy`, `prisma db push`, seed scripts, resets, or unrelated migrations.
- Do not apply SQL unless the user explicitly confirms the exact target database and that a current provider backup exists.
- If authorized, apply only the idempotent additive SQL from the named migration, then verify the column and foreign key exist.
- Do not change message delivery semantics to suppress or hide notification errors.
- After the schema update, verify the deployed message-send flow and report the result.
