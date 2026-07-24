-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "wristband" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "SeatTable" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'Main',
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "note" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeatTable_eventId_idx" ON "SeatTable"("eventId");

-- AddForeignKey
ALTER TABLE "SeatTable" ADD CONSTRAINT "SeatTable_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
