ALTER TABLE "Notification"
    ADD COLUMN IF NOT EXISTS "listingId" TEXT;

CREATE INDEX IF NOT EXISTS "Notification_listingId_idx"
    ON "Notification"("listingId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Notification_listingId_fkey'
            AND conrelid = '"Notification"'::regclass
    ) THEN
        ALTER TABLE "Notification"
            ADD CONSTRAINT "Notification_listingId_fkey"
            FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
