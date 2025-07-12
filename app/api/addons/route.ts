import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Addon } from "@prisma/client";

// Type for request body
type CreateAddonInput = {
  name: string;
  price: number;
  stockQuantity?: number;
};

export async function GET(): Promise<NextResponse<Addon[]>> {
  const addons = await prisma.addon.findMany({
    orderBy: { createdAt: "desc" },
    include: { stock: true },
  });
  return NextResponse.json(addons);
}

export async function POST(
  req: Request
): Promise<NextResponse<Addon | { error: string }>> {
  const data: CreateAddonInput = await req.json();

  if (!data.name || typeof data.price !== "number") {
    return NextResponse.json(
      { error: "Invalid input. 'name' and 'price' are required." },
      { status: 400 }
    );
  }

  const addon = await prisma.addon.create({
    data: {
      name: data.name,
      price: data.price,
      stock: {
        create: { quantity: data.stockQuantity ?? 0 },
      },
    },
  });

  return NextResponse.json(addon);
}
