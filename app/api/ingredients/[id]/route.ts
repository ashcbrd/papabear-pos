import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Ingredient } from "@prisma/client";

type Params = { params: { id: string } };

// GET single ingredient
export async function GET(
  _req: Request,
  { params }: Params
): Promise<NextResponse<Ingredient | { error: string }>> {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id: params.id },
    include: { stock: true },
  });

  if (!ingredient) {
    return NextResponse.json(
      { error: "Ingredient not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(ingredient);
}

// PUT - Update ingredient
export async function PUT(
  req: Request,
  { params }: Params
): Promise<NextResponse<Ingredient | { error: string }>> {
  const {
    name,
    measurementUnit,
    unitsPerPurchase,
    pricePerPurchase,
    stockQuantity,
  }: {
    name: string;
    measurementUnit: string;
    unitsPerPurchase?: number;
    pricePerPurchase: number;
    stockQuantity?: number;
  } = await req.json();

  if (!name || !measurementUnit || typeof pricePerPurchase !== "number") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const pricePerUnit =
    unitsPerPurchase && unitsPerPurchase > 0
      ? pricePerPurchase / unitsPerPurchase
      : pricePerPurchase;

  const updated = await prisma.ingredient.update({
    where: { id: params.id },
    data: {
      name,
      measurementUnit,
      unitsPerPurchase,
      pricePerPurchase,
      pricePerUnit,
      stock: {
        upsert: {
          create: { quantity: stockQuantity ?? 0 },
          update: { quantity: stockQuantity ?? 0 },
        },
      },
    },
    include: { stock: true },
  });

  return NextResponse.json(updated);
}

// DELETE - Remove ingredient
export async function DELETE(
  _req: Request,
  { params }: Params
): Promise<NextResponse<{ message: string }>> {
  await prisma.ingredient.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Ingredient deleted successfully" });
}
