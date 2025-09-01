"use client";

import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AdminCard } from "@/components/admin";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";

interface AnalyticsChartsProps {
  monthlyData?: any[];
  hourlyData?: any[];
  productData?: any[];
  categoryData?: any[];
  revenueData?: any[];
  cashFlowData?: any[];
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

const formatCurrency = (value: number) => `₱${(value || 0).toLocaleString()}`;

export function RevenueChart({ revenueData = [] }: { revenueData?: any[] }) {
  return (
    <AdminCard>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
        </div>
        <p className="text-gray-600">Monthly revenue performance</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="month"
              className="text-gray-500 text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              className="text-gray-500 text-sm"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={[formatCurrency, "Revenue"]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#revenueGradient)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AdminCard>
  );
}

export function SalesVolumeChart({
  monthlyData = [],
}: {
  monthlyData?: any[];
}) {
  return (
    <AdminCard>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Sales Volume</h3>
        </div>
        <p className="text-gray-600">Monthly sales comparison</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="month"
              className="text-gray-500 text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              className="text-gray-500 text-sm"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={[formatCurrency, "Sales"]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar
              dataKey="total"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AdminCard>
  );
}

export function HourlyAnalyticsChart({
  hourlyData = [],
}: {
  hourlyData?: any[];
}) {
  return (
    <AdminCard>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Hourly Sales Pattern
          </h3>
        </div>
        <p className="text-gray-600">Sales distribution throughout the day</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="hour"
              className="text-gray-500 text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              className="text-gray-500 text-sm"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={[formatCurrency, "Sales"]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AdminCard>
  );
}

export function ProductPerformanceChart({
  productData = [],
}: {
  productData?: any[];
}) {
  return (
    <AdminCard>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <PieChartIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Product Performance
          </h3>
        </div>
        <p className="text-gray-600">Revenue breakdown by product</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={productData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="revenue"
            >
              {productData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={[formatCurrency, "Revenue"]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </AdminCard>
  );
}

export function CashFlowChart({ cashFlowData = [] }: { cashFlowData?: any[] }) {
  return (
    <AdminCard>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Cash Flow Analysis
          </h3>
        </div>
        <p className="text-gray-600">Income vs expenses over time</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              className="text-gray-500 text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              className="text-gray-500 text-sm"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend />
            <Bar
              dataKey="inflow"
              fill="#10b981"
              name="Income"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="outflow"
              fill="#ef4444"
              name="Expenses"
              radius={[2, 2, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="netFlow"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Net Flow"
              dot={{ fill: "#f59e0b", r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </AdminCard>
  );
}

export function SalesMetricsGrid({
  metrics,
}: {
  metrics: {
    avgOrderValue: number;
    totalCustomers: number;
    conversionRate: number;
    peakHour: string;
    topProduct: string;
    profitMargin: number;
  };
}) {
  const metricCards = [
    {
      title: "Avg Order Value",
      value: formatCurrency(metrics.avgOrderValue || 0),
      icon: <ShoppingBag className="w-6 h-6" />,
      color: "blue",
      change: "+5.2%",
    },
    {
      title: "Total Customers",
      value: (metrics.totalCustomers || 0).toLocaleString(),
      icon: <TrendingUp className="w-6 h-6" />,
      color: "green",
      change: "+12.5%",
    },
    {
      title: "Peak Hour",
      value: metrics.peakHour,
      icon: <Clock className="w-6 h-6" />,
      color: "purple",
      change: "Most Active",
    },
    {
      title: "Profit Margin",
      value: `${metrics.profitMargin}%`,
      icon: <DollarSign className="w-6 h-6" />,
      color: "orange",
      change: metrics.profitMargin > 50 ? "Excellent" : "Good",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {metricCards.map((metric, index) => (
        <AdminCard key={index} className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {metric.value}
              </p>
              <p className="text-xs text-gray-500">{metric.change}</p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                colorClasses[metric.color as keyof typeof colorClasses]
              }`}
            >
              {metric.icon}
            </div>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

export default function AnalyticsCharts(props: AnalyticsChartsProps) {
  return (
    <div className="space-y-8">
      <RevenueChart revenueData={props.revenueData} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesVolumeChart monthlyData={props.monthlyData} />
        <HourlyAnalyticsChart hourlyData={props.hourlyData} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductPerformanceChart productData={props.productData} />
        <CashFlowChart cashFlowData={props.cashFlowData} />
      </div>
    </div>
  );
}
