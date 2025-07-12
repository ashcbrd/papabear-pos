/*
  Warnings:

  - You are about to drop the column `purchaseUnit` on the `Ingredient` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "measurementUnit" TEXT NOT NULL,
    "unitsPerPurchase" REAL,
    "pricePerPurchase" REAL NOT NULL,
    "pricePerUnit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Ingredient" ("createdAt", "id", "measurementUnit", "name", "pricePerPurchase", "pricePerUnit", "unitsPerPurchase") SELECT "createdAt", "id", "measurementUnit", "name", "pricePerPurchase", "pricePerUnit", "unitsPerPurchase" FROM "Ingredient";
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
