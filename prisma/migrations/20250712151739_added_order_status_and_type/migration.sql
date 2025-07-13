-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "total" REAL NOT NULL,
    "paid" REAL NOT NULL,
    "change" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderType" TEXT NOT NULL DEFAULT 'DINE_IN',
    "orderStatus" TEXT NOT NULL DEFAULT 'QUEUING'
);
INSERT INTO "new_Order" ("change", "createdAt", "id", "paid", "total") SELECT "change", "createdAt", "id", "paid", "total" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
