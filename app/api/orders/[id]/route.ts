import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, OrderType } from "@prisma/client";

interface UpdateOrderInput {
  orderStatus?: OrderStatus;
  orderType?: OrderType;
  total?: number;
  paid?: number;
  change?: number;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Record<string, string> }
): Promise<NextResponse> {
  const id = context?.params?.id;

  if (!id) {
    return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  }

  const data: UpdateOrderInput = await request.json();

  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(data.orderStatus && { orderStatus: data.orderStatus }),
        ...(data.orderType && { orderType: data.orderType }),
        ...(typeof data.total === "number" && { total: data.total }),
        ...(typeof data.paid === "number" && { paid: data.paid }),
        ...(typeof data.change === "number" && { change: data.change }),
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("❌ Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  try {
    // Delete associated receipt first (if exists)
    await prisma.receipt.deleteMany({
      where: { orderId: id },
    });

    // Delete order items and their addons
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: id },
      select: { id: true },
    });

    const orderItemIds = orderItems.map((item) => item.id);

    await prisma.orderItemAddon.deleteMany({
      where: { orderItemId: { in: orderItemIds } },
    });

    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    // Now delete the order
    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Failed to delete order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

// GET /api/orders/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
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
        receipt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Failed to get order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
