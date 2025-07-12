-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Addon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Addon" ("id", "name", "price") SELECT "id", "name", "price" FROM "Addon";
DROP TABLE "Addon";
ALTER TABLE "new_Addon" RENAME TO "Addon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
