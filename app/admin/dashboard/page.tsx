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
import { format, parseISO } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PiggyBank,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Star,
  Meh,
  CalendarDays,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import CustomSelect from "@/components/custom-select"; // Make sure the path is correct

type DateFilter = "all" | "month" | "today" | "range" | "custom";

interface DashboardStats {
  all_time_earning: number;
  all_time_products_sold: number;
  this_month_sales: number;
  last_month_sales: number;
  trend: "up" | "down";
  trend_percent: number;
  best_product: string;
  least_product: string;
  busiest_hour: string;
  least_hour: string;
}

interface DailyEntry {
  date: string;
  total: number;
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
  const [allTimeDailyData, setAllTimeDailyData] = useState<DailyEntry[]>([]);
  const [busiestWeekday, setBusiestWeekday] = useState<string>("");
  const [slowestWeekday, setSlowestWeekday] = useState<string>("");

  const [filter, setFilter] = useState<DateFilter>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const filterOptions: { label: string; value: DateFilter }[] = [
    { label: "All Time", value: "all" },
    { label: "This Month", value: "month" },
    { label: "Today", value: "today" },
    { label: "Custom Range", value: "range" },
    { label: "Custom Date", value: "custom" },
  ];

  const loadData = async () => {
    const params = new URLSearchParams({ filter });

    if (filter === "range" && startDate && endDate) {
      params.append("start", startDate.toISOString());
      params.append("end", endDate.toISOString());
    }

    if (filter === "custom" && startDate) {
      params.append("date", startDate.toISOString());
    }

    const res = await fetch(`/api/dashboard?${params.toString()}`);
    const json = await res.json();

    setStats(json.stats);
    setMonthlyData(json.monthly);
    setProductData(json.products);
    setHourData(json.hours || []);
    setAllTimeDailyData(json.all_time_daily || []);
  };

  useEffect(() => {
    loadData();
  }, [filter, startDate, endDate]);

  // Compute average weekday performance
  useEffect(() => {
    if (allTimeDailyData.length === 0) return;

    const weekdayTotals: { [day: string]: { total: number; count: number } } = {
      Sunday: { total: 0, count: 0 },
      Monday: { total: 0, count: 0 },
      Tuesday: { total: 0, count: 0 },
      Wednesday: { total: 0, count: 0 },
      Thursday: { total: 0, count: 0 },
      Friday: { total: 0, count: 0 },
      Saturday: { total: 0, count: 0 },
    };

    for (const entry of allTimeDailyData) {
      const date = parseISO(entry.date);
      const day = format(date, "EEEE");
      weekdayTotals[day].total += entry.total;
      weekdayTotals[day].count += 1;
    }

    const averageByDay = Object.entries(weekdayTotals).map(
      ([day, { total, count }]) => ({
        day,
        avg: count === 0 ? 0 : total / count,
      })
    );

    averageByDay.sort((a, b) => b.avg - a.avg);
    setBusiestWeekday(averageByDay[0].day);
    setSlowestWeekday(averageByDay[averageByDay.length - 1].day);
  }, [allTimeDailyData]);

  if (!stats) return <div className="p-6 text-lg">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2">
        <LayoutDashboard size={24} className="text-green-700" />
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <CustomSelect<DateFilter>
          value={filter}
          options={filterOptions}
          onChange={(value) => setFilter(value)}
          className="w-60"
        />
        {filter === "range" && (
          <>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start date"
              className="border border-zinc-300 px-2 py-1 rounded-md"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              placeholderText="End date"
              className="border border-zinc-300 px-2 py-1 rounded-md"
            />
          </>
        )}

        {filter === "custom" && (
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Pick a date"
            className="border border-zinc-300 px-2 py-1 rounded-md"
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<PiggyBank />}
          title="All-Time Earning"
          value={`₱${stats.all_time_earning.toLocaleString()}`}
          variant="revenue"
        />
        <StatCard
          icon={<ShoppingBag />}
          title="Products Sold"
          value={stats.all_time_products_sold}
          variant="products"
        />
        <StatCard
          icon={<PiggyBank />}
          title="This Month Sales"
          value={`₱${stats.this_month_sales.toLocaleString()}`}
          variant="revenue"
        />
        <StatCard
          icon={stats.trend === "up" ? <TrendingUp /> : <TrendingDown />}
          title={stats.trend === "up" ? "Uptrend" : "Downtrend"}
          value={
            <span
              className={`font-semibold ${
                stats.trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.trend_percent.toFixed(2)}%
            </span>
          }
          variant={stats.trend === "up" ? "trend-up" : "trend-down"}
        />

        <StatCard
          icon={<CalendarDays />}
          title="Busiest Day"
          value={busiestWeekday}
          variant="busiest"
        />
        <StatCard
          icon={<CalendarDays />}
          title="Slowest Day"
          value={slowestWeekday}
          variant="slowest"
        />
        <StatCard
          icon={<Clock />}
          title="Busiest Hour"
          value={stats.busiest_hour}
          variant="busiest"
        />
        <StatCard
          icon={<Clock />}
          title="Slowest Hour"
          value={stats.least_hour}
          variant="slowest"
        />
        <StatCard
          icon={<Star />}
          title="Best Product"
          value={stats.best_product}
          variant="best"
          className="col-span-2"
        />
        <StatCard
          icon={<Meh />}
          title="Least Product"
          value={stats.least_product}
          variant="least"
          className="col-span-2"
        />
      </div>

      {/* Charts */}
      <ChartSection title="📆 Monthly Sales Trend">
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

      <ChartSection title="🍽️ Top Selling Products">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={productData}>
            <XAxis dataKey="product" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantity" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title="⏰ Sales by Hour">
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
  );
}

type StatVariant =
  | "revenue"
  | "products"
  | "trend-up"
  | "trend-down"
  | "best"
  | "least"
  | "busiest"
  | "slowest"
  | "default";

const variantStyles: Record<StatVariant, string> = {
  revenue: "from-green-100 to-green-200",
  products: "from-blue-100 to-blue-200",
  "trend-up": "from-emerald-100 to-emerald-200",
  "trend-down": "from-rose-100 to-rose-200",
  best: "from-yellow-100 to-yellow-200",
  least: "from-zinc-100 to-zinc-200",
  busiest: "from-lime-100 to-lime-200",
  slowest: "from-red-100 to-red-200",
  default: "from-gray-100 to-gray-200",
};

function StatCard({
  icon,
  title,
  value,
  variant = "default",
  className = "",
}: {
  icon?: React.ReactNode;
  title: string;
  value: React.ReactNode;
  variant?: StatVariant;
  className?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${variantStyles[variant]} border border-zinc-300 rounded-md p-4 flex flex-col gap-2 ${className}`}
    >
      <div className="flex items-center gap-2 text-sm text-gray-700">
        {icon}
        {title}
      </div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function ChartSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-300 rounded-md p-4 h-96">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>
      <div className="w-full h-[80%]">{children}</div>
    </div>
  );
}
