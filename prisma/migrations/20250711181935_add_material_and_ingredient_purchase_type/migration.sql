/*
  Warnings:

  - You are about to drop the column `price` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Material` table. All the data in the column will be lost.
  - Added the required column `measurementUnit` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerPurchase` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerUnit` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseUnit` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerPiece` to the `Material` table without a default value. This is not possible if the table is not empty.

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
    "pricePerUnit" REAL NOT NULL
);
INSERT INTO "new_Ingredient" ("id", "name") SELECT "id", "name" FROM "Ingredient";
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";
CREATE TABLE "new_Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pricePerPiece" REAL NOT NULL,
    "isPackage" BOOLEAN NOT NULL DEFAULT false,
    "packagePrice" REAL,
    "unitsPerPackage" INTEGER
);
INSERT INTO "new_Material" ("id", "name") SELECT "id", "name" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
