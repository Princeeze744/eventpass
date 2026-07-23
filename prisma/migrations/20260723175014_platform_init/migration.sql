/*
  Warnings:

  - A unique constraint covering the columns `[eventId,phone]` on the table `Guest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `Guest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "eventId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT 'A Celebration',
    "eventDate" TEXT NOT NULL,
    "eventTime" TEXT NOT NULL DEFAULT '12:00 PM',
    "venue" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#d4af37',
    "deadline" TIMESTAMP(3),
    "capacity" INTEGER,
    "approvalMode" TEXT NOT NULL DEFAULT 'manual',
    "adminKey" TEXT NOT NULL,
    "usherKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_email_key" ON "Organizer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_eventId_phone_key" ON "Guest"("eventId", "phone");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
