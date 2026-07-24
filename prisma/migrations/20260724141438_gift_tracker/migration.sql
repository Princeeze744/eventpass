-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "giftType" TEXT NOT NULL DEFAULT 'cash',
    "amount" INTEGER,
    "item" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "thanked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gift_eventId_idx" ON "Gift"("eventId");

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
