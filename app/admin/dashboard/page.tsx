"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Wallet,
  Users,
  Package,
  Calendar,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminStat,
  AdminSelect,
} from "@/components/admin";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthSelect } from "@/components/ui/month-select";
import AnalyticsCharts, {
  RevenueChart,
  SalesVolumeChart,
  HourlyAnalyticsChart,
  ProductPerformanceChart,
  CashFlowChart,
  SalesMetricsGrid,
} from "@/components/admin/AnalyticsCharts";
import { useData } from "@/lib/data-context";
import { format } from "date-fns";

type DateFilter =
  | "all"
  | "month"
  | "week"
  | "today"
  | "selected_month"
  | "date_range";

interface DashboardStats {
  all_time_earning: number;
  all_time_products_sold: number;
  this_month_sales: number;
  last_month_sales: number;
  trend: "up" | "down";
  trend_percent: number;
  best_product: string;
  worst_product: string;
  busiest_hour: string;
  slowest_hour: string;
  cashDrawerBalance?: number;
  todayInflow?: number;
  todayOutflow?: number;
  todayNetFlow?: number;
  totalOrders?: number;
  todayOrders?: number;
  lowStockItems?: number;
  totalRevenue?: number;
}

interface AnalyticsData {
  stats: DashboardStats;
  monthly: { month: string; total: number }[];
  hours: { hour: string; total: number }[];
  products: { product: string; quantity: number }[];
  all_time_daily: { date: string; total: number }[];
}

export default function AdminDashboardPage() {
  const { getDashboardStats } = useData();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [filter, setFilter] = useState<DateFilter>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const filterOptions: { label: string; value: DateFilter }[] = [
    { label: "All Time", value: "all" },
    { label: "This Month", value: "month" },
    { label: "This Week", value: "week" },
    { label: "Today", value: "today" },
    { label: "Selected Month", value: "selected_month" },
    { label: "Date Range", value: "date_range" },
  ];

  const loadData = async () => {
    try {
      const filters: any = {
        filter,
        selectedMonth: selectedMonth || undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      };
      const data = await getDashboardStats(filters);

      if (data) {
        setStats(data.stats);
        setAnalyticsData(data);

        // Load cash flow data for analytics
        const cashFlow = await getDashboardStats({ type: "cashflow" });
        setCashFlowData(cashFlow?.cashFlow || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter, selectedMonth, startDate, endDate]);

  if (!stats) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Dashboard"
          icon={<BarChart3 size={24} />}
          description="Overview of your Papa Bear Café performance"
        />
        <AdminCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading dashboard data...</p>
            </div>
          </div>
        </AdminCard>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Revenue",
      value: `₱${stats.totalRevenue?.toLocaleString() || "0"}`,
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      trend: {
        value: stats.trend_percent || 0,
        isPositive: stats.trend === "up",
      },
      description: "All time earnings",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders?.toLocaleString() || "0",
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
      description: `${stats.todayOrders || 0} orders today`,
    },
    {
      title: "Cash Drawer",
      value: `₱${stats.cashDrawerBalance?.toLocaleString() || "0"}`,
      icon: <Wallet className="w-6 h-6 text-green-600" />,
      description: "Current balance",
    },
    {
      title: "Today's Sales",
      value: `₱${stats.todayInflow?.toLocaleString() || "0"}`,
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      description: "Revenue today",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        icon={<BarChart3 size={24} />}
        description="Overview of your Papa Bear Café performance"
      />

      {/* Filter Controls */}
      <AdminCard>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">
              Time Period:
            </label>
            <AdminSelect
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as DateFilter);
                // Reset other filters when changing filter type
                if (e.target.value !== "selected_month") setSelectedMonth("");
                if (e.target.value !== "date_range") {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }
              }}
              options={filterOptions}
              fullWidth={false}
              className="w-48"
            />
            {/* Filter Status Indicator */}
            <div className="flex items-center gap-2">
              {filter !== "all" && (
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  Filtered View
                </div>
              )}
            </div>
          </div>

          {/* Selected Month Input */}
          {filter === "selected_month" && (
            <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <label className="text-sm font-semibold text-emerald-700">
                Select Month:
              </label>
              <MonthSelect
                value={selectedMonth}
                onValueChange={setSelectedMonth}
                placeholder="Pick a month"
                className="bg-white border-emerald-300 min-w-[200px]"
              />
              {selectedMonth && (
                <span className="text-sm text-emerald-600">
                  Viewing:{" "}
                  {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                </span>
              )}
            </div>
          )}

          {/* Date Range Inputs */}
          {filter === "date_range" && (
            <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <label className="text-sm font-semibold text-emerald-700">
                  Custom Date Range:
                </label>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs text-emerald-600 mb-1">
                    From:
                  </label>
                  <DatePicker
                    date={startDate}
                    onSelect={setStartDate}
                    placeholder="Start date"
                    toDate={new Date()}
                    className="bg-white border-emerald-300"
                  />
                </div>
                <span className="text-emerald-500 mt-5">→</span>
                <div>
                  <label className="block text-xs text-emerald-600 mb-1">
                    To:
                  </label>
                  <DatePicker
                    date={endDate}
                    onSelect={setEndDate}
                    placeholder="End date"
                    fromDate={startDate}
                    toDate={new Date()}
                    className="bg-white border-emerald-300"
                  />
                </div>
                {startDate && endDate && (
                  <span className="text-sm text-emerald-600 mt-5">
                    (
                    {Math.ceil(
                      (endDate.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1}{" "}
                    days)
                  </span>
                )}
              </div>
              {startDate && !endDate && (
                <p className="text-xs text-emerald-600">
                  Please select an end date to complete the range.
                </p>
              )}
            </div>
          )}
        </div>
      </AdminCard>

      {/* Filter Summary */}
      {filter !== "all" && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Currently viewing:
              {filter === "today" && " Today's data"}
              {filter === "week" && " This week's data"}
              {filter === "month" && " This month's data"}
              {filter === "selected_month" &&
                selectedMonth &&
                ` ${format(selectedMonth, "MMMM yyyy")} data`}
              {filter === "date_range" &&
                startDate &&
                endDate &&
                ` ${format(startDate, "MMM d")} - ${format(
                  endDate,
                  "MMM d, yyyy"
                )} data`}
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
        {statsData.map((stat, index) => (
          <AdminStat
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            description={stat.description}
          />
        ))}
      </div>

      {/* Advanced Analytics Section */}
      {analyticsData && (
        <>
          {/* Sales Metrics Grid */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Key Performance Metrics
            </h3>
            <SalesMetricsGrid
              metrics={{
                avgOrderValue:
                  analyticsData.stats.totalRevenue /
                    analyticsData.stats.totalOrders || 0,
                totalCustomers: analyticsData.stats.totalOrders,
                conversionRate: 85.2,
                peakHour: analyticsData.stats.busiest_hour,
                topProduct: analyticsData.stats.best_product,
                profitMargin: 65,
              }}
            />
          </div>

          {/* Revenue Analytics Chart */}
          <div className="mb-8">
            <RevenueChart
              revenueData={
                analyticsData.monthly?.map((item) => ({
                  ...item,
                  revenue: item.total,
                })) || []
              }
            />
          </div>

          {/* Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SalesVolumeChart monthlyData={analyticsData.monthly} />
            <HourlyAnalyticsChart hourlyData={analyticsData.hours} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductPerformanceChart
              productData={
                analyticsData.products?.map((item) => ({
                  name: item.product,
                  revenue: item.quantity * 120, // Estimated revenue per product
                  value: item.quantity * 120,
                })) || []
              }
            />
            <CashFlowChart
              cashFlowData={
                cashFlowData.length > 0
                  ? cashFlowData
                  : [
                      {
                        date: "Jan",
                        inflow: 45000,
                        outflow: 12000,
                        netFlow: 33000,
                      },
                      {
                        date: "Feb",
                        inflow: 52000,
                        outflow: 15000,
                        netFlow: 37000,
                      },
                      {
                        date: "Mar",
                        inflow: 48000,
                        outflow: 18000,
                        netFlow: 30000,
                      },
                      {
                        date: "Apr",
                        inflow: 61000,
                        outflow: 14000,
                        netFlow: 47000,
                      },
                      {
                        date: "May",
                        inflow: 55000,
                        outflow: 16000,
                        netFlow: 39000,
                      },
                      {
                        date: "Jun",
                        inflow: 67000,
                        outflow: 13000,
                        netFlow: 54000,
                      },
                    ]
              }
            />
          </div>
        </>
      )}

      {/* Business Insights Summary */}
      <AdminCard>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Business Insights
          </h3>
          <p className="text-gray-600">Key performance indicators</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mx-auto mb-3 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-emerald-900 mb-1">
              Top Performer
            </h4>
            <p className="text-sm text-emerald-700 font-medium">
              {stats.best_product}
            </p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto mb-3 shadow-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-red-900 mb-1">Needs Attention</h4>
            <p className="text-sm text-red-700 font-medium">
              {stats.worst_product}
            </p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mx-auto mb-3 shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-emerald-900 mb-1">Peak Hours</h4>
            <p className="text-sm text-emerald-700 font-medium">
              {stats.busiest_hour}
            </p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full mx-auto mb-3 shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Quiet Hours</h4>
            <p className="text-sm text-gray-700 font-medium">
              {stats.slowest_hour}
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
