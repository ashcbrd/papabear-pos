"use client";

import { useEffect, useState } from "react";
import CustomSelect from "@/components/custom-select";
import { ClipboardList, Calendar, Filter } from "lucide-react";
import { useData } from "@/lib/data-context";
import { formatDateTime } from "@/lib/date-utils";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminInput
} from "@/components/admin";

type DateFilter = "all" | "month" | "today" | "range" | "custom";

type Order = {
  id: string;
  total: number;
  paid: number;
  change: number;
  createdAt: string;
  items: {
    product: { name: string };
    variant: { name: string; price: number };
    quantity: number;
    addons: {
      addon: { name: string; price: number };
      quantity: number;
    }[];
  }[];
};

const filterOptions = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "Today", value: "today" },
  { label: "Custom Range", value: "range" },
  { label: "Custom Date", value: "custom" },
] satisfies { label: string; value: DateFilter }[];

export default function AdminOrdersPage() {
  const { orders: allOrders, loadOrders } = useData();
  const [filter, setFilter] = useState<DateFilter>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    loadOrders({ filter, startDate, endDate });
  }, [filter, startDate, endDate, loadOrders]);

  // Filter orders based on current filter
  const orders = allOrders;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Orders"
        icon={<ClipboardList size={24} />}
        description="View and manage all customer orders"
        actions={
          <AdminButton
            variant="outline"
            icon={<Filter size={16} />}
            onClick={() => {/* Add filter functionality */}}
          >
            Advanced Filters
          </AdminButton>
        }
      />

      <AdminCard>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Filter Orders</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <CustomSelect<DateFilter>
              value={filter}
              onChange={setFilter}
              options={filterOptions}
              className="w-60"
            />

            {filter === "range" && (
              <>
                <AdminInput
                  type="date"
                  value={startDate?.toISOString().split("T")[0] || ""}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  fullWidth={false}
                  className="w-48"
                  icon={<Calendar size={18} />}
                />
                <AdminInput
                  type="date"
                  value={endDate?.toISOString().split("T")[0] || ""}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  fullWidth={false}
                  className="w-48"
                  icon={<Calendar size={18} />}
                />
              </>
            )}

            {filter === "custom" && (
              <AdminInput
                type="date"
                value={startDate?.toISOString().split("T")[0] || ""}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                fullWidth={false}
                className="w-48"
                icon={<Calendar size={18} />}
              />
            )}
          </div>
        </div>
      </AdminCard>

      {orders.length === 0 ? (
        <AdminCard>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">No orders match your current filter criteria.</p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <AdminCard key={order.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Order ID:</span>
                    <span className="font-mono text-sm font-bold text-gray-900">{order.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">₱{order.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                </div>
              </div>

              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => {
                  const variantTotal = (item.variant?.price || 0) * item.quantity;
                  const addonsTotal = item.addons?.reduce(
                    (sum: number, a: any) => sum + (a.addon?.price || 0) * a.quantity,
                    0
                  ) || 0;
                  const itemTotal = variantTotal + addonsTotal;

                  return (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {item.product?.name || 'Unknown Product'} – {item.variant?.name || 'Unknown Variant'}
                          </h4>
                          <div className="text-sm text-gray-600">
                            Quantity: {item.quantity} × ₱{(item.variant?.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">₱{itemTotal.toFixed(2)}</div>
                        </div>
                      </div>

                      {item.addons?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Add-ons:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.addons.map((a: any, i: number) => (
                              <div key={i} className="flex justify-between text-sm text-gray-600">
                                <span>{a.addon?.name || 'Unknown Addon'} × {a.quantity}</span>
                                <span>₱{((a.addon?.price || 0) * a.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-blue-900">₱{order.total?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-blue-600">Total</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-green-900">₱{order.paid?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-green-600">Paid</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-emerald-900">₱{order.change?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-emerald-600">Change</div>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
