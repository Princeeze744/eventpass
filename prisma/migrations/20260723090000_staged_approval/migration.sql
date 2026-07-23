/*
  Warnings:

  - You are about to drop the column `rsvped` on the `Guest` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'Guest',
    "table" TEXT NOT NULL DEFAULT 'TBA',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "checkedInOnline" BOOLEAN NOT NULL DEFAULT false,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Guest" ("checkedIn", "checkedInAt", "createdAt", "id", "name", "passId", "phone", "table", "tier") SELECT "checkedIn", "checkedInAt", "createdAt", "id", "name", "passId", "phone", "table", "tier" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
CREATE UNIQUE INDEX "Guest_passId_key" ON "Guest"("passId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
