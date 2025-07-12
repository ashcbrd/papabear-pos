import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Material } from "@prisma/client";

type CreateMaterialInput = {
  name: string;
  isPackage: boolean;
  packagePrice?: number;
  unitsPerPackage?: number;
  pricePerPiece?: number;
  stockQuantity?: number;
};

export async function POST(
  req: Request
): Promise<NextResponse<Material | { error: string }>> {
  const data: CreateMaterialInput = await req.json();

  const {
    name,
    isPackage,
    packagePrice,
    unitsPerPackage,
    pricePerPiece,
    stockQuantity = 0,
  } = data;

  if (!name || typeof isPackage !== "boolean") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const finalPricePerPiece =
    isPackage &&
    packagePrice !== undefined &&
    unitsPerPackage &&
    unitsPerPackage > 0
      ? packagePrice / unitsPerPackage
      : pricePerPiece ?? 0;

  const material = await prisma.material.create({
    data: {
      name,
      isPackage,
      packagePrice: isPackage ? packagePrice : null,
      unitsPerPackage: isPackage ? unitsPerPackage : null,
      pricePerPiece: finalPricePerPiece,
      stock: {
        create: { quantity: stockQuantity },
      },
    },
  });

  return NextResponse.json(material);
}

export async function GET(): Promise<NextResponse<Material[]>> {
  const materials = await prisma.material.findMany({
    orderBy: { createdAt: "desc" },
    include: { stock: true },
  });
  return NextResponse.json(materials);
}
