import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all receipts
export async function GET() {
  const receipts = await prisma.receipt.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: {
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
      },
    },
  });

  return NextResponse.json(receipts);
}
