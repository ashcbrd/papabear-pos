"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";

interface DashboardStats {
  all_time_earning: number;
  all_time_products_sold: number;
  this_month_sales: number;
  last_month_sales: number;
  trend: "up" | "down";
  trend_percent: number;
  best_product: string;
  least_product: string;
  busiest_day: string;
  least_day: string;
  busiest_hour: number;
  least_hour: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<
    { month: string; total: number }[]
  >([]);
  const [productData, setProductData] = useState<
    { product: string; quantity: number }[]
  >([]);
  const [hourData, setHourData] = useState<{ hour: string; total: number }[]>(
    []
  );

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setStats(json.stats);
      setMonthlyData(json.monthly);
      setProductData(json.products);
      setHourData(
        json.hours.map((entry: { hour: string; total: number }) => ({
          ...entry,
          hour: formatHour(parseInt(entry.hour, 10)),
        }))
      );
    };
    load();
  }, []);

  if (!stats) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="All-Time Earning"
          value={`₱${stats.all_time_earning.toLocaleString()}`}
        />
        <StatCard
          title="All-Time Products Sold"
          value={stats.all_time_products_sold}
        />
        <StatCard
          title="This Month Sales"
          value={`₱${stats.this_month_sales.toLocaleString()}`}
        />
        <StatCard
          title={stats.trend === "up" ? "📈 Uptrend" : "📉 Downtrend"}
          value={`${stats.trend_percent.toFixed(2)}%`}
        />
      </div>

      {/* Product Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Best Product" value={stats.best_product} />
        <StatCard title="Least Product" value={stats.least_product} />
      </div>

      {/* Time-based Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Busiest Day" value={stats.busiest_day} />
        <StatCard title="Slowest Day" value={stats.least_day} />
        <StatCard title="Top Hour" value={formatHour(stats.busiest_hour)} />
        <StatCard title="Slowest Hour" value={formatHour(stats.least_hour)} />
      </div>

      {/* Charts */}
      <div className="space-y-10">
        <ChartSection title="Monthly Sales Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#6366f1" />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection title="Top Selling Products">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productData}>
              <XAxis dataKey="product" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection title="Sales by Hour">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const formatted = ((hour + 11) % 12) + 1;
  return `${formatted}:00 ${suffix}`;
}

// 💡 Reusable stat display box
function StatCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

// 💡 Reusable chart wrapper
function ChartSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-lg shadow p-4 h-96">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="w-full h-[80%]">{children}</div>
    </div>
  );
}
