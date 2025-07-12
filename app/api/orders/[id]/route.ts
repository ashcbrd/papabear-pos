import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Order } from "@prisma/client";

interface OrderAddon {
  id: string;
  quantity: number;
}

interface OrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
  addons: OrderAddon[];
}

interface CreateOrderInput {
  items: OrderItemInput[];
  total: number;
  paid: number;
  change: number;
}

export async function POST(
  req: Request
): Promise<NextResponse<Order | { error: string }>> {
  const data: CreateOrderInput = await req.json();

  const { items, total, paid, change } = data;

  if (
    !items ||
    !Array.isArray(items) ||
    typeof total !== "number" ||
    typeof paid !== "number" ||
    typeof change !== "number"
  ) {
    return NextResponse.json({ error: "Invalid order input" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      total,
      paid,
      change,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          addons: {
            create: item.addons.map((addon) => ({
              addonId: addon.id,
              quantity: addon.quantity,
            })),
          },
        })),
      },
    },
    include: {
      items: {
        include: {
          addons: true,
        },
      },
    },
  });

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        ingredients: true,
        materials: true,
      },
    });

    if (!product) continue;

    for (const pi of product.ingredients) {
      await prisma.stock.updateMany({
        where: { ingredientId: pi.ingredientId },
        data: {
          quantity: { decrement: pi.quantityUsed * item.quantity },
        },
      });
    }

    for (const pm of product.materials) {
      await prisma.stock.updateMany({
        where: { materialId: pm.materialId },
        data: {
          quantity: { decrement: pm.quantityUsed * item.quantity },
        },
      });
    }

    for (const addon of item.addons) {
      await prisma.stock.updateMany({
        where: { addonId: addon.id },
        data: {
          quantity: { decrement: addon.quantity },
        },
      });
    }
  }

  return NextResponse.json(order);
}
