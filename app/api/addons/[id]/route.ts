import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Addon } from "@prisma/client";

type Params = { params: { id: string } };

export async function GET(
  _req: Request,
  { params }: Params
): Promise<NextResponse<Addon | { error: string }>> {
  const addon = await prisma.addon.findUnique({
    where: { id: params.id },
    include: { stock: true },
  });

  if (!addon) {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }

  return NextResponse.json(addon);
}

export async function PUT(
  req: Request,
  { params }: Params
): Promise<NextResponse<Addon | { error: string }>> {
  const data = await req.json();

  if (!data.name || typeof data.price !== "number") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const addon = await prisma.addon.update({
    where: { id: params.id },
    data: {
      name: data.name,
      price: data.price,
      stock: {
        upsert: {
          create: { quantity: data.stockQuantity ?? 0 },
          update: { quantity: data.stockQuantity ?? 0 },
        },
      },
    },
    include: { stock: true },
  });

  return NextResponse.json(addon);
}

export async function DELETE(
  _req: Request,
  { params }: Params
): Promise<NextResponse<{ message: string }>> {
  await prisma.addon.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Addon deleted successfully" });
}
