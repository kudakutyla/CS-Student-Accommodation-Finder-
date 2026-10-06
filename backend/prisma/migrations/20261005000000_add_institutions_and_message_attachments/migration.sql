-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_name_key"
    ON "Institution"("name");

CREATE INDEX "Institution_name_idx"
    ON "Institution"("name");

-- AlterTable: Campus
ALTER TABLE "Campus"
    ADD COLUMN "institutionId" TEXT;

-- AddForeignKey
ALTER TABLE "Campus"
    ADD CONSTRAINT "Campus_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "Institution"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Campus_institutionId_idx"
    ON "Campus"("institutionId");

-- AlterTable: Message
ALTER TABLE "Message"
    ADD COLUMN "attachmentUrl" TEXT,
    ADD COLUMN "attachmentName" TEXT,
    ADD COLUMN "attachmentType" TEXT;
