/*
  Warnings:

  - You are about to drop the column `organizerId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the `Organizer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ownerId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_organizerId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "organizerId",
ADD COLUMN     "hostName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Guest',
ADD COLUMN     "partySize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "partyUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seat" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "section" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "souvenirTaken" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Organizer";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'planner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
