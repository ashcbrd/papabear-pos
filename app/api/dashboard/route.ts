import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { format, subMonths, startOfMonth } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const filter = searchParams.get("filter") || "all";
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const dateParam = searchParams.get("date");

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

  // Filter Orders by Date
  let filteredOrders = allOrders;

  if (filter === "month") {
    const start = startOfMonth(new Date());
    filteredOrders = allOrders.filter(
      (order) => new Date(order.createdAt) >= start
    );
  } else if (filter === "today") {
    const today = new Date().toDateString();
    filteredOrders = allOrders.filter(
      (order) => new Date(order.createdAt).toDateString() === today
    );
  } else if (filter === "range" && startParam && endParam) {
    const start = new Date(startParam);
    const end = new Date(endParam);
    filteredOrders = allOrders.filter((order) => {
      const date = new Date(order.createdAt);
      return date >= start && date <= end;
    });
  } else if (filter === "custom" && dateParam) {
    const customDate = new Date(dateParam).toDateString();
    filteredOrders = allOrders.filter(
      (order) => new Date(order.createdAt).toDateString() === customDate
    );
  }

  // Aggregation maps
  let allTimeEarning = 0;
  let allTimeProductsSold = 0;

  const monthlyMap: Record<string, number> = {};
  const productMap: Record<string, number> = {};
  const hourMap: Record<number, number> = {};
  const dayMap: Record<string, number> = {};

  for (const order of filteredOrders) {
    allTimeEarning += order.total;
    const orderDate = new Date(order.createdAt);

    const monthKey = format(orderDate, "yyyy-MM");
    const dayKey = format(orderDate, "yyyy-MM-dd");
    const hour = orderDate.getHours();

    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + order.total;
    dayMap[dayKey] = (dayMap[dayKey] || 0) + order.total;
    hourMap[hour] = (hourMap[hour] || 0) + order.total;

    for (const item of order.items) {
      allTimeProductsSold += item.quantity;

      const name = item.product.name;
      productMap[name] = (productMap[name] || 0) + item.quantity;
    }
  }

  // Trend
  const thisMonthKey = format(startOfMonth(new Date()), "yyyy-MM");
  const lastMonthKey = format(
    startOfMonth(subMonths(new Date(), 1)),
    "yyyy-MM"
  );

  const thisMonthSales = monthlyMap[thisMonthKey] || 0;
  const lastMonthSales = monthlyMap[lastMonthKey] || 0;

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

  // Top and bottom products
  const sortedProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]);
  const bestProduct = sortedProducts[0]?.[0] || "N/A";
  const leastProduct = sortedProducts[sortedProducts.length - 1]?.[0] || "N/A";

  // Busiest and slowest day
  const sortedDays = Object.entries(dayMap).sort((a, b) => b[1] - a[1]);
  const busiestDay = sortedDays[0]?.[0] || "N/A";
  const leastDay = sortedDays[sortedDays.length - 1]?.[0] || "N/A";

  // Busiest and slowest hour
  const sortedHours = Object.entries(hourMap).sort((a, b) => b[1] - a[1]);
  const busiestHourValue = parseInt(sortedHours[0]?.[0] ?? "0", 10);
  const leastHourValue = parseInt(
    sortedHours[sortedHours.length - 1]?.[0] ?? "0",
    10
  );

  function formatHour(hour: number): string {
    const suffix = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h}:00 ${suffix}`;
  }

  function formatHourRange(hour: number): string {
    const start = formatHour(hour);
    const end = formatHour((hour + 1) % 24);
    return `${start} - ${end}`;
  }

  const busiestHour = formatHourRange(busiestHourValue);
  const leastHour = formatHourRange(leastHourValue);

  const allTimeDaily = Object.entries(dayMap).map(([date, total]) => ({
    date,
    total,
  }));

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
      busiest_hour: busiestHour,
      least_hour: leastHour,
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
    all_time_daily: allTimeDaily,
  });
}
