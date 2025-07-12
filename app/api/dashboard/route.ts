import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  // Sales and quantity
  const allOrders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
          variant: true,
          addons: true,
        },
      },
    },
  });

  // --- All Time Sales ---
  let allTimeEarning = 0;
  let allTimeProductsSold = 0;
  const monthlyMap: Record<string, number> = {};
  const productMap: Record<string, number> = {};
  const productNameMap: Record<string, string> = {};
  const hourMap: Record<number, number> = {};
  const dayMap: Record<string, number> = {};

  for (const order of allOrders) {
    allTimeEarning += order.total;
    const orderDate = new Date(order.createdAt);
    const monthKey = format(orderDate, "yyyy-MM");
    const hour = orderDate.getHours();
    const day = format(orderDate, "yyyy-MM-dd");

    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + order.total;
    hourMap[hour] = (hourMap[hour] || 0) + order.total;
    dayMap[day] = (dayMap[day] || 0) + order.total;

    for (const item of order.items) {
      allTimeProductsSold += item.quantity;

      const name = item.product.name;
      productMap[name] = (productMap[name] || 0) + item.quantity;
      productNameMap[item.productId] = name;
    }
  }

  const thisMonth = format(startOfMonth(new Date()), "yyyy-MM");
  const lastMonth = format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM");

  const thisMonthSales = monthlyMap[thisMonth] || 0;
  const lastMonthSales = monthlyMap[lastMonth] || 0;

  const trend =
    lastMonthSales === 0
      ? "up"
      : thisMonthSales >= lastMonthSales
      ? "up"
      : "down";

  const trendPercent =
    lastMonthSales === 0
      ? 100
      : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;

  const bestProduct =
    Object.entries(productMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const leastProduct =
    Object.entries(productMap).sort((a, b) => a[1] - b[1])[0]?.[0] || "N/A";

  const busiestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const leastDay = Object.entries(dayMap).sort((a, b) => a[1] - b[1])[0]?.[0];

  const busiestHour = Object.entries(hourMap).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];
  const leastHour = Object.entries(hourMap).sort((a, b) => a[1] - b[1])[0]?.[0];

  return NextResponse.json({
    stats: {
      all_time_earning: allTimeEarning,
      all_time_products_sold: allTimeProductsSold,
      this_month_sales: thisMonthSales,
      last_month_sales: lastMonthSales,
      trend,
      trend_percent: trendPercent,
      best_product: bestProduct,
      least_product: leastProduct,
      busiest_day: busiestDay,
      least_day: leastDay,
      busiest_hour: Number(busiestHour ?? 0),
      least_hour: Number(leastHour ?? 0),
    },

    monthly: Object.entries(monthlyMap).map(([month, total]) => ({
      month,
      total,
    })),

    products: Object.entries(productMap).map(([product, quantity]) => ({
      product,
      quantity,
    })),

    hours: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      total: hourMap[i] || 0,
    })),
  });
}
