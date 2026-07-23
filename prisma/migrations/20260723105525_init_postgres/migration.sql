-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'Guest',
    "table" TEXT NOT NULL DEFAULT 'TBA',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "checkedInOnline" BOOLEAN NOT NULL DEFAULT false,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_passId_key" ON "Guest"("passId");
