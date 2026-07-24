-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invitedBy" TEXT,
ADD COLUMN     "staffLevel" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "staffSince" TIMESTAMP(3);
