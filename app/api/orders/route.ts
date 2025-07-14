import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Order, OrderType, OrderStatus } from "@prisma/client";

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
  orderType: OrderType;
  orderStatus?: OrderStatus; // optional (defaults to QUEUING)
}

// POST /api/orders
export async function POST(
  req: Request
): Promise<NextResponse<Order | { error: string }>> {
  const data: CreateOrderInput = await req.json();
  const { items, total, paid, change, orderType, orderStatus } = data;

  if (
    !items ||
    !Array.isArray(items) ||
    typeof total !== "number" ||
    typeof paid !== "number" ||
    typeof change !== "number" ||
    !orderType ||
    !Object.values(OrderType).includes(orderType)
  ) {
    return NextResponse.json({ error: "Invalid order input" }, { status: 400 });
  }

  try {
    const order = await prisma.order.create({
      data: {
        total,
        paid,
        change,
        orderType,
        orderStatus: orderStatus || OrderStatus.QUEUING,
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
// GET /api/orders
export async function GET(req: Request): Promise<NextResponse<Order[]>> {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const customDate = searchParams.get("date");

  let dateFilter = {};

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  if (filter === "today") {
    dateFilter = {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    };
  } else if (filter === "month") {
    dateFilter = {
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    };
  } else if (filter === "range" && start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // include full end day
    dateFilter = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };
  } else if (filter === "custom" && customDate) {
    const date = new Date(customDate);
    const dateStart = new Date(date.setHours(0, 0, 0, 0));
    const dateEnd = new Date(date.setHours(23, 59, 59, 999));
    dateFilter = {
      createdAt: {
        gte: dateStart,
        lte: dateEnd,
      },
    };
  }

  try {
    const orders = await prisma.order.findMany({
      where: dateFilter,
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
