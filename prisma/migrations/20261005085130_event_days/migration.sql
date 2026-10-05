-- CreateTable
CREATE TABLE "EventDay" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "dateISO" TEXT NOT NULL DEFAULT '',
    "dateText" TEXT NOT NULL DEFAULT '',
    "time" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestDay" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "callTime" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "GuestDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventDay_eventId_idx" ON "EventDay"("eventId");

-- CreateIndex
CREATE INDEX "GuestDay_guestId_idx" ON "GuestDay"("guestId");

-- CreateIndex
CREATE INDEX "GuestDay_dayId_idx" ON "GuestDay"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestDay_guestId_dayId_key" ON "GuestDay"("guestId", "dayId");

-- AddForeignKey
ALTER TABLE "EventDay" ADD CONSTRAINT "EventDay_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestDay" ADD CONSTRAINT "GuestDay_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestDay" ADD CONSTRAINT "GuestDay_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "EventDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
