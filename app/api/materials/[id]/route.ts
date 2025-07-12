import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Material } from "@prisma/client";

type Params = { params: { id: string } };

export async function GET(
  _req: Request,
  { params }: Params
): Promise<NextResponse<Material | { error: string }>> {
  const material = await prisma.material.findUnique({
    where: { id: params.id },
    include: { stock: true },
  });

  if (!material) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  return NextResponse.json(material);
}

export async function PUT(
  req: Request,
  { params }: Params
): Promise<NextResponse<Material | { error: string }>> {
  const {
    name,
    isPackage,
    packagePrice,
    unitsPerPackage,
    pricePerPiece,
    stockQuantity,
  }: {
    name: string;
    isPackage: boolean;
    packagePrice?: number;
    unitsPerPackage?: number;
    pricePerPiece?: number;
    stockQuantity?: number;
  } = await req.json();

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

  const material = await prisma.material.update({
    where: { id: params.id },
    data: {
      name,
      isPackage,
      packagePrice: isPackage ? packagePrice : null,
      unitsPerPackage: isPackage ? unitsPerPackage : null,
      pricePerPiece: finalPricePerPiece,
      stock: {
        upsert: {
          create: { quantity: stockQuantity ?? 0 },
          update: { quantity: stockQuantity ?? 0 },
        },
      },
    },
    include: { stock: true },
  });

  return NextResponse.json(material);
}

export async function DELETE(
  _req: Request,
  { params }: Params
): Promise<NextResponse<{ message: string }>> {
  try {
    await prisma.stock.deleteMany({ where: { materialId: params.id } }); // if needed
    await prisma.material.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
