-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "loadInTime" TEXT,
ADD COLUMN     "vendorBrief" TEXT;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "callTime" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "company" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isVendor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendorNote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vendorRole" TEXT NOT NULL DEFAULT '';
