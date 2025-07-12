"use client";

import { useEffect, useState } from "react";

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then(setOrders);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Orders</h1>

      {orders.length === 0 && <p className="text-gray-500">No orders found.</p>}

      {orders.map((order) => (
        <div
          key={order.id}
          className="border p-4 rounded space-y-2 bg-white shadow-sm"
        >
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Order ID:</span> {order.id}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
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
                  className="border p-2 rounded bg-gray-50 text-sm"
                >
                  <div className="font-medium">
                    {item.product.name} – {item.variant.name} × {item.quantity}
                  </div>

                  {item.addons.length > 0 && (
                    <ul className="ml-4 mt-1 list-disc text-xs text-gray-700">
                      {item.addons.map((a, i) => (
                        <li key={i}>
                          {a.addon.name} × {a.quantity} (₱
                          {a.addon.price.toFixed(2)})
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="text-right mt-2 text-sm font-semibold">
                    Item Total: ₱{itemTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-sm text-gray-700 border-t mt-2">
            <div>Total: ₱{order.total.toFixed(2)}</div>
            <div>Paid: ₱{order.paid.toFixed(2)}</div>
            <div>Change: ₱{order.change.toFixed(2)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
