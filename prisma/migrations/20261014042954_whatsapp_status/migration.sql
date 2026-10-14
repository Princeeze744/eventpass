-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "waError" TEXT,
ADD COLUMN     "waMessageId" TEXT,
ADD COLUMN     "waSentAt" TIMESTAMP(3),
ADD COLUMN     "waStatus" TEXT NOT NULL DEFAULT '';
