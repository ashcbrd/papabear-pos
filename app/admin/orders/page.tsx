"use client";

import { useEffect, useState } from "react";
import CustomSelect from "@/components/custom-select";
import { ClipboardList } from "lucide-react";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<DateFilter>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ filter });

    if (filter === "range" && startDate && endDate) {
      params.append("start", startDate.toISOString());
      params.append("end", endDate.toISOString());
    }

    if (filter === "custom" && startDate) {
      params.append("date", startDate.toISOString());
    }

    fetch(`/api/orders?${params.toString()}`)
      .then((res) => res.json())
      .then(setOrders);
  }, [filter, startDate, endDate]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList size={24} className="text-green-700" />
        <h1 className="text-xl font-bold">Orders</h1>
      </div>

      <div className="flex items-center gap-4 flex-wrap mb-4">
        <CustomSelect<DateFilter>
          value={filter}
          onChange={setFilter}
          options={filterOptions}
          className="w-60"
        />

        {filter === "range" && (
          <>
            <input
              type="date"
              value={startDate?.toISOString().split("T")[0] || ""}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="border border-zinc-300 px-2 py-1 rounded-md"
            />
            <input
              type="date"
              value={endDate?.toISOString().split("T")[0] || ""}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="border border-zinc-300 px-2 py-1 rounded-md"
            />
          </>
        )}

        {filter === "custom" && (
          <input
            type="date"
            value={startDate?.toISOString().split("T")[0] || ""}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="border border-zinc-300 px-2 py-1 rounded-md"
          />
        )}
      </div>

      {orders.length === 0 && (
        <div className="text-gray-500 border border-zinc-300 bg-white rounded-md p-6 text-center">
          No orders found.
        </div>
      )}

      {orders.map((order) => (
        <div
          key={order.id}
          className="border border-zinc-300 p-4 rounded-md bg-white space-y-4"
        >
          <div className="flex justify-between items-center border-b border-zinc-300 pb-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Order ID:</span> {order.id}
            </div>
            <div className="text-gray-500">
              {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="space-y-3">
            {order.items.map((item, idx) => {
              const variantTotal = item.variant.price * item.quantity;
              const addonsTotal = item.addons.reduce(
                (sum, a) => sum + a.addon.price * a.quantity,
                0
              );
              const itemTotal = variantTotal + addonsTotal;

              return (
                <div
                  key={idx}
                  className="border border-zinc-200 p-3 rounded-md bg-gray-50 text-sm"
                >
                  <div className="font-semibold">
                    {item.product.name} – {item.variant.name} × {item.quantity}{" "}
                    (₱{item.variant.price.toFixed(2)})
                  </div>

                  {item.addons.length > 0 && (
                    <ul className="ml-4 mt-2 list-disc text-xs text-gray-700">
                      {item.addons.map((a, i) => (
                        <li key={i}>
                          {a.addon.name} × {a.quantity} (₱
                          {a.addon.price.toFixed(2)})
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="text-right mt-3 font-semibold">
                    Item Total: ₱{itemTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-zinc-300 pt-3 text-sm text-gray-700 font-medium">
            <div>Total: ₱{order.total.toFixed(2)}</div>
            <div>Paid: ₱{order.paid.toFixed(2)}</div>
            <div>Change: ₱{order.change.toFixed(2)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
