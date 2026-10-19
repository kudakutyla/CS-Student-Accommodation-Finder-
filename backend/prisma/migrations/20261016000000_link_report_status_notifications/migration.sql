ALTER TABLE "Notification"
    ADD COLUMN IF NOT EXISTS "reportId" TEXT;

WITH matching_reports AS (
    SELECT
        notification."id" AS "notificationId",
        report."id" AS "reportId",
        MIN(ABS(EXTRACT(EPOCH FROM (notification."createdAt" - audit."createdAt")))) AS "secondsApart"
    FROM "Notification" AS notification
    JOIN "AuditLog" AS audit
        ON audit."targetType" = 'REPORT'
        AND audit."action" = 'UPDATE_REPORT_STATUS'
    JOIN "Report" AS report
        ON report."id" = audit."targetId"
        AND report."userId" = notification."userId"
    JOIN "Listing" AS listing
        ON listing."id" = report."listingId"
    WHERE notification."type" = 'REPORT_STATUS'
        AND POSITION(
            'Your report about "' || listing."title" || '" is now '
            IN notification."message"
        ) > 0
        AND (
            (notification."message" LIKE '% is now in review.%' AND audit."description" LIKE '% to IN_REVIEW.%')
            OR (notification."message" LIKE '% is now resolved.%' AND audit."description" LIKE '% to RESOLVED.%')
            OR (notification."message" LIKE '% is now dismissed.%' AND audit."description" LIKE '% to DISMISSED.%')
        )
    GROUP BY notification."id", report."id"
),
uniquely_matched_reports AS (
    SELECT
        "notificationId",
        MIN("reportId") AS "reportId"
    FROM matching_reports
    WHERE "secondsApart" < 60
    GROUP BY "notificationId"
    HAVING COUNT(*) = 1
)
UPDATE "Notification" AS notification
SET "reportId" = uniquely_matched_reports."reportId"
FROM uniquely_matched_reports
WHERE notification."id" = uniquely_matched_reports."notificationId"
    AND notification."reportId" IS NULL;

CREATE INDEX IF NOT EXISTS "Notification_reportId_idx" ON "Notification"("reportId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Notification_reportId_fkey'
            AND conrelid = '"Notification"'::regclass
    ) THEN
        ALTER TABLE "Notification"
            ADD CONSTRAINT "Notification_reportId_fkey"
            FOREIGN KEY ("reportId") REFERENCES "Report"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
