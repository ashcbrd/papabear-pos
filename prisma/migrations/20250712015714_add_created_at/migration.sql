-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "purchaseUnit" TEXT NOT NULL,
    "measurementUnit" TEXT NOT NULL,
    "unitsPerPurchase" REAL,
    "pricePerPurchase" REAL NOT NULL,
    "pricePerUnit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Ingredient" ("id", "measurementUnit", "name", "pricePerPurchase", "pricePerUnit", "purchaseUnit", "unitsPerPurchase") SELECT "id", "measurementUnit", "name", "pricePerPurchase", "pricePerUnit", "purchaseUnit", "unitsPerPurchase" FROM "Ingredient";
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";
CREATE TABLE "new_Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pricePerPiece" REAL NOT NULL,
    "isPackage" BOOLEAN NOT NULL DEFAULT false,
    "packagePrice" REAL,
    "unitsPerPackage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Material" ("id", "isPackage", "name", "packagePrice", "pricePerPiece", "unitsPerPackage") SELECT "id", "isPackage", "name", "packagePrice", "pricePerPiece", "unitsPerPackage" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
