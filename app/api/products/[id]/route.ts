import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Category } from "@prisma/client";

type Params = { params: { id: string } };

type IngredientInput = {
  id: string;
  quantity: number;
};

type MaterialInput = {
  id: string;
  quantity: number;
};

type VariantInput = {
  name: string;
  price: number;
  ingredients: IngredientInput[];
  materials: MaterialInput[];
};

type UpdateProductInput = {
  name: string;
  category: Category;
  variants: VariantInput[];
  imageUrl?: string;
};

// ✅ GET /api/products/[id]
export async function GET(_req: Request, { params }: Params) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        variants: {
          include: {
            ingredients: { include: { ingredient: true } },
            materials: { include: { material: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET product error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  const data: UpdateProductInput = await req.json();
  const { name, category, variants, imageUrl } = data;

  if (!name || !category || !Array.isArray(variants) || variants.length === 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    // 1. Fetch existing variants
    const existingVariants = await prisma.variant.findMany({
      where: { productId: id },
      include: {
        ingredients: true,
        materials: true,
      },
    });

    // 2. Build map for easier lookup
    const existingMap = new Map(existingVariants.map((v) => [v.name, v]));

    const variantIdsUsedInOrders = await prisma.variant.findMany({
      where: {
        productId: id,
        orderItems: { some: {} },
      },
      select: { id: true },
    });

    const usedIds = new Set(variantIdsUsedInOrders.map((v) => v.id));

    // 3. Update or create variants
    for (const variant of variants) {
      const existing = existingMap.get(variant.name);

      if (existing) {
        // Clean ingredients/materials first
        await prisma.variantIngredient.deleteMany({
          where: { variantId: existing.id },
        });
        await prisma.variantMaterial.deleteMany({
          where: { variantId: existing.id },
        });

        // Update price if needed
        await prisma.variant.update({
          where: { id: existing.id },
          data: {
            price: variant.price,
            ingredients: {
              create: variant.ingredients.map((ing) => ({
                ingredient: { connect: { id: ing.id } },
                quantityUsed: ing.quantity,
              })),
            },
            materials: {
              create: variant.materials.map((mat) => ({
                material: { connect: { id: mat.id } },
                quantityUsed: mat.quantity,
              })),
            },
          },
        });
      } else {
        // Create new variant
        await prisma.variant.create({
          data: {
            name: variant.name,
            price: variant.price,
            productId: id,
            ingredients: {
              create: variant.ingredients.map((ing) => ({
                ingredient: { connect: { id: ing.id } },
                quantityUsed: ing.quantity,
              })),
            },
            materials: {
              create: variant.materials.map((mat) => ({
                material: { connect: { id: mat.id } },
                quantityUsed: mat.quantity,
              })),
            },
          },
        });
      }
    }

    // 4. Delete unused variants (that are not used in orders)
    const namesToKeep = new Set(variants.map((v) => v.name));
    const toDelete = existingVariants.filter(
      (v) => !namesToKeep.has(v.name) && !usedIds.has(v.id)
    );

    for (const v of toDelete) {
      await prisma.variantIngredient.deleteMany({ where: { variantId: v.id } });
      await prisma.variantMaterial.deleteMany({ where: { variantId: v.id } });
      await prisma.variant.delete({ where: { id: v.id } });
    }

    // 5. Update the product itself
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        imageUrl: imageUrl ?? null,
      },
      include: {
        variants: {
          include: {
            ingredients: { include: { ingredient: true } },
            materials: { include: { material: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    // 🚫 Check if the product or its variants are used in any order
    const hasOrderItems = await prisma.orderItem.findFirst({
      where: {
        OR: [{ productId: id }, { variant: { productId: id } }],
      },
    });

    if (hasOrderItems) {
      return NextResponse.json(
        { message: "Cannot delete product with associated orders." },
        { status: 400 }
      );
    }

    // 🧹 Clean up all variant-related data
    const variants = await prisma.variant.findMany({
      where: { productId: id },
      select: { id: true },
    });

    const variantIds = variants.map((v) => v.id);

    if (variantIds.length > 0) {
      await prisma.variantIngredient.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      await prisma.variantMaterial.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      await prisma.variant.deleteMany({
        where: { id: { in: variantIds } },
      });
    }

    // 🗑️ Delete the product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { message: "Failed to delete product", error: String(error) },
      { status: 500 }
    );
  }
}
