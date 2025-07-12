import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Category } from "@prisma/client";

type VariantInput = {
  name: string;
  price: number;
  ingredients: { id: string; quantity: number }[];
  materials: { id: string; quantity: number }[];
};

type CreateProductInput = {
  name: string;
  category: Category;
  imageUrl?: string;
  variants: VariantInput[];
};

// POST /api/products
export async function POST(req: Request) {
  const data: CreateProductInput = await req.json();
  const { name, category, imageUrl, variants } = data;

  if (!name || !category || !Array.isArray(variants) || variants.length === 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        category,
        imageUrl: imageUrl ?? null,
        variants: {
          create: variants.map((variant) => ({
            name: variant.name,
            price: variant.price,
            materials: {
              create: variant.materials.map((mat) => ({
                material: { connect: { id: mat.id } },
                quantityUsed: mat.quantity,
              })),
            },
            ingredients: {
              create: variant.ingredients.map((ing) => ({
                ingredient: { connect: { id: ing.id } },
                quantityUsed: ing.quantity,
              })),
            },
          })),
        },
      },
      include: {
        variants: {
          include: {
            materials: { include: { material: true } },
            ingredients: { include: { ingredient: true } },
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        variants: {
          include: {
            materials: {
              include: { material: true },
            },
            ingredients: {
              include: { ingredient: true },
            },
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
