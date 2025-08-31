import {
  Addon,
  Ingredient,
  Material,
  Product,
  Flavor,
  Size,
  Stock,
  Category,
} from "@prisma/client";

// 🔗 Linked Materials per size
export type LinkedMaterial = {
  materialId: string;
  amount: number;
  unit: string;
};

// Flavors
export type FlavorInput = {
  name: string;
};

// Sizes
export type SizeInput = {
  name: string;
  price: number;
  linkedMaterials?: LinkedMaterial[]; // ← NEW: optional list of used materials
};

// Products
export type ProductInput = {
  name: string;
  category: Category;
  flavors: { name: string }[];
  sizes: { name: string; price: number }[];
  imageUrl?: string;
  materials: { materialId: string; quantity: number }[];
  ingredients: { ingredientId: string; amount: number }[];
  // (other properties, if any)
};

export type ProductWithFlavorsAndSizes = Product & {
  flavors: Flavor[];
  sizes: Size[];
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
  measurementUnit: string;
  unitsPerPurchase?: number;
  pricePerPurchase: number;
  pricePerUnit?: number;
  stockQuantity?: number;
};

export type IngredientWithStock = Ingredient & {
  stock: Stock | null;
};
