-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "deletedAt" TIMESTAMP(3);
