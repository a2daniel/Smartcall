-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CallOutLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "acceptedById" INTEGER,
    "filledAt" DATETIME,
    "respondedAt" DATETIME,
    "missed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CallOutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CallOutLog_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CallOutLog_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CallOutLog" ("id", "reason", "shiftId", "timestamp", "userId") SELECT "id", "reason", "shiftId", "timestamp", "userId" FROM "CallOutLog";
DROP TABLE "CallOutLog";
ALTER TABLE "new_CallOutLog" RENAME TO "CallOutLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
