import {
  Addon,
  Ingredient,
  Material,
  Product,
  Variant,
  Stock,
  Category,
} from "@prisma/client";

// 🔗 Linked Materials per variant
export type LinkedMaterial = {
  materialId: string;
  amount: number;
  unit: string;
};

// Variants
export type VariantInput = {
  name: string;
  price: number;
  linkedMaterials?: LinkedMaterial[]; // ← NEW: optional list of used materials
};

// Products
export type ProductInput = {
  name: string;
  category: Category;
  variants: { name: string; price: number }[];
  imageUrl?: string;
  materials: { materialId: string; quantity: number }[];
  ingredients: { ingredientId: string; amount: number }[];
  // (other properties, if any)
};

export type ProductWithVariants = Product & {
  variants: Variant[];
  imageUrl?: string;
};

// Addons
export type AddonInput = {
  name: string;
  price: number;
  stockQuantity?: number;
};

export type AddonWithStock = Addon & {
  stock: Stock | null;
};

// Materials
export type MaterialInput = {
  name: string;
  isPackage: boolean;
  packagePrice?: number;
  unitsPerPackage?: number;
  pricePerPiece?: number;
  stockQuantity?: number;
};

export type MaterialWithStock = Material & {
  stock: Stock | null;
};

// Ingredients
export type IngredientInput = {
  name: string;
  purchaseUnit: string;
  measurementUnit: string;
  unitsPerPurchase?: number;
  pricePerPurchase: number;
  stockQuantity?: number;
};

export type IngredientWithStock = Ingredient & {
  stock: Stock | null;
};
