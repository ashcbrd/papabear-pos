/*
  Warnings:

  - You are about to drop the `ProductIngredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMaterial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductIngredient";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductMaterial";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "VariantIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantityUsed" REAL NOT NULL,
    "variantId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    CONSTRAINT "VariantIngredient_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VariantIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VariantMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantityUsed" REAL NOT NULL,
    "variantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    CONSTRAINT "VariantMaterial_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VariantMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
