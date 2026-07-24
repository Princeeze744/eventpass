-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "rsvpAnswer" TEXT NOT NULL DEFAULT 'yes';
