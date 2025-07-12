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

// POST /api/orders
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

  try {
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
            product: true,
            variant: {
              include: {
                ingredients: true,
                materials: true,
              },
            },
            addons: {
              include: {
                addon: true,
              },
            },
          },
        },
      },
    });

    // Deduct stocks
    for (const item of order.items) {
      const variant = item.variant;

      // Deduct ingredients used by variant
      for (const vi of variant.ingredients) {
        await prisma.stock.updateMany({
          where: { ingredientId: vi.ingredientId },
          data: {
            quantity: {
              decrement: vi.quantityUsed * item.quantity,
            },
          },
        });
      }

      // Deduct materials used by variant
      for (const vm of variant.materials) {
        await prisma.stock.updateMany({
          where: { materialId: vm.materialId },
          data: {
            quantity: {
              decrement: vm.quantityUsed * item.quantity,
            },
          },
        });
      }

      // Deduct addon stock
      for (const addon of item.addons) {
        await prisma.stock.updateMany({
          where: { addonId: addon.addonId },
          data: {
            quantity: {
              decrement: addon.quantity,
            },
          },
        });
      }
    }

    // Create receipt
    await prisma.receipt.create({
      data: {
        orderId: order.id,
        content: {
          id: order.id,
          total: order.total,
          paid: order.paid,
          change: order.change,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            product: item.product.name,
            variant: item.variant.name,
            quantity: item.quantity,
            addons: item.addons.map((addon) => ({
              name: addon.addon.name,
              quantity: addon.quantity,
            })),
          })),
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// GET /api/orders
export async function GET(): Promise<NextResponse<Order[]>> {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            addons: {
              include: {
                addon: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("❌ Fetch orders error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
