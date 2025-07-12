import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Ingredient } from "@prisma/client";

type CreateIngredientInput = {
  name: string;
  measurementUnit: string;
  unitsPerPurchase?: number;
  pricePerPurchase: number;
  stockQuantity?: number;
};

// POST - Create a new ingredient
export async function POST(
  req: Request
): Promise<NextResponse<Ingredient | { error: string }>> {
  const data: CreateIngredientInput = await req.json();

  const {
    name,
    measurementUnit,
    unitsPerPurchase,
    pricePerPurchase,
    stockQuantity = 0,
  } = data;

  if (!name || !measurementUnit || typeof pricePerPurchase !== "number") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const pricePerUnit =
    unitsPerPurchase && unitsPerPurchase > 0
      ? pricePerPurchase / unitsPerPurchase
      : pricePerPurchase;

  const ingredient = await prisma.ingredient.create({
    data: {
      name,
      measurementUnit,
      unitsPerPurchase,
      pricePerPurchase,
      pricePerUnit,
      stock: {
        create: { quantity: stockQuantity },
      },
    },
  });

  return NextResponse.json(ingredient);
}

// GET - List all ingredients
export async function GET(): Promise<NextResponse<Ingredient[]>> {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { createdAt: "desc" },
    include: { stock: true },
  });
  return NextResponse.json(ingredients);
}
