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
} from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminStat,
  AdminSelect,
} from "@/components/admin";
import { useData } from "@/lib/data-context";

type DateFilter = "all" | "month" | "today";

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
  cashDrawerBalance?: number;
  todayInflow?: number;
  todayOutflow?: number;
  todayNetFlow?: number;
  totalOrders?: number;
  todayOrders?: number;
  lowStockItems?: number;
  totalRevenue?: number;
}

export default function AdminDashboardPage() {
  const { getDashboardStats } = useData();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<
    { month: string; total: number }[]
  >([]);
  const [productData, setProductData] = useState<
    { product: string; quantity: number }[]
  >([]);
  const [filter, setFilter] = useState<DateFilter>("all");

  const filterOptions: { label: string; value: DateFilter }[] = [
    { label: "All Time", value: "all" },
    { label: "This Month", value: "month" },
    { label: "Today", value: "today" },
  ];

  const loadData = async () => {
    try {
      const filters: any = { filter };
      const data = await getDashboardStats(filters);
      
      if (data) {
        setStats(data.stats);
        setMonthlyData(data.monthly || []);
        setProductData(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

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
      value: `₱${stats.totalRevenue?.toLocaleString() || '0'}`,
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      trend: {
        value: stats.trend_percent || 0,
        isPositive: stats.trend === 'up'
      },
      description: "All time earnings"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders?.toLocaleString() || '0',
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
      description: `${stats.todayOrders || 0} orders today`
    },
    {
      title: "Cash Drawer",
      value: `₱${stats.cashDrawerBalance?.toLocaleString() || '0'}`,
      icon: <Wallet className="w-6 h-6 text-green-600" />,
      description: "Current balance"
    },
    {
      title: "Today's Sales", 
      value: `₱${stats.todayInflow?.toLocaleString() || '0'}`,
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      description: "Revenue today"
    }
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
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">Time Period:</label>
          <AdminSelect
            value={filter}
            onChange={(e) => setFilter(e.target.value as DateFilter)}
            options={filterOptions}
            fullWidth={false}
            className="w-48"
          />
        </div>
      </AdminCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <AdminCard>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Monthly Sales</h3>
            <p className="text-gray-600">Sales trends over the last 6 months</p>
          </div>
          <div className="space-y-4">
            {monthlyData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.month}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min((item.total / Math.max(...monthlyData.map(d => d.total))) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ₱{item.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Top Products */}
        <AdminCard>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Top Products</h3>
            <p className="text-gray-600">Best selling items</p>
          </div>
          <div className="space-y-4">
            {productData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.product}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.quantity} sold
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* Business Insights */}
      <AdminCard>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Business Insights</h3>
          <p className="text-gray-600">Key performance indicators</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Best Product</h4>
            <p className="text-sm text-gray-600">{stats.best_product}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Busiest Hour</h4>
            <p className="text-sm text-gray-600">{stats.busiest_hour}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Month Trend</h4>
            <p className="text-sm text-gray-600">
              {stats.trend === 'up' ? '↗️' : '↘️'} {stats.trend_percent}%
            </p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mx-auto mb-3">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Low Stock</h4>
            <p className="text-sm text-gray-600">{stats.lowStockItems || 0} items</p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}