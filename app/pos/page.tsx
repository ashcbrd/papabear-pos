"use client";

import { useEffect, useState } from "react";
import {
  Category,
  Variant,
  Addon,
  Product as ProductType,
} from "@prisma/client";
import { Plus, Minus, Trash } from "lucide-react";
import OrderConfirmationDialog from "@/components/order-confirmation-dialog";

type ProductWithVariants = ProductType & { variants: Variant[] };

type OrderAddon = {
  addon: Addon;
  quantity: number;
};

type OrderItem = {
  product: ProductWithVariants;
  variant: Variant;
  quantity: number;
  addons: OrderAddon[];
};

export default function POSPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const categories: (Category | "All")[] = [
    "All",
    "InsideMeals",
    "InsideBeverages",
    "OutsideSnacks",
  ];

  const [selectedCategory, setSelectedCategory] = useState<Category | "All">(
    "InsideMeals"
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);

    fetch("/api/addons")
      .then((res) => res.json())
      .then(setAddons);
  }, []);

  const addProductToOrder = (product: ProductWithVariants) => {
    const existingIndex = orderItems.findIndex(
      (item) => item.product.id === product.id
    );

    if (existingIndex !== -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      setOrderItems(updated);
    } else {
      const defaultVariant =
        product.variants.find((v) => v.name === "general") ||
        product.variants[0];

      setOrderItems([
        ...orderItems,
        {
          product,
          variant: defaultVariant,
          quantity: 1,
          addons: [],
        },
      ]);
    }
  };

  const updateItemQuantity = (index: number, change: number) => {
    const items = [...orderItems];
    items[index].quantity = Math.max(1, items[index].quantity + change);
    setOrderItems(items);
  };

  const removeItem = (index: number) => {
    const items = [...orderItems];
    items.splice(index, 1);
    setOrderItems(items);
  };

  const updateVariant = (index: number, variantId: string) => {
    const items = [...orderItems];
    const variant = items[index].product.variants.find(
      (v) => v.id === variantId
    );
    if (variant) {
      items[index].variant = variant;
      setOrderItems(items);
    }
  };

  const updateAddon = (
    itemIndex: number,
    addonId: string,
    quantity: number
  ) => {
    const items = [...orderItems];
    const addon = addons.find((a) => a.id === addonId);
    if (!addon) return;

    const existing = items[itemIndex].addons.find(
      (a) => a.addon.id === addonId
    );
    if (existing) {
      existing.quantity = quantity;
    } else {
      items[itemIndex].addons.push({ addon, quantity });
    }

    items[itemIndex].addons = items[itemIndex].addons.filter(
      (a) => a.quantity > 0
    );
    setOrderItems(items);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const productTotal = item.variant.price * item.quantity;
      const addonTotal = item.addons.reduce(
        (sum, a) => sum + a.addon.price * a.quantity,
        0
      );
      return total + productTotal + addonTotal;
    }, 0);
  };

  const isPaymentSufficient = parseFloat(payment || "0") >= calculateTotal();

  const handleDigit = (digit: string) => {
    setPayment((prev) => (prev === "0" ? digit : prev + digit));
  };

  const clearPayment = () => setPayment("");
  const deleteDigit = () => setPayment(payment.slice(0, -1));

  const handleConfirmOrder = async () => {
    const payload = {
      items: orderItems.map((item) => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity,
        addons: item.addons.map((a) => ({
          id: a.addon.id,
          quantity: a.quantity,
        })),
      })),
      total: calculateTotal(),
      paid: parseFloat(payment || "0"),
      change: parseFloat(payment || "0") - calculateTotal(),
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOrderItems([]);
      setPayment("");
      setShowDialog(false);
      alert("Order placed successfully");
    }
  };

  return (
    <div className="p-4 grid grid-cols-12 gap-4">
      <div className="col-span-8 space-y-4">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as Category)}
              className={`px-10 py-6 rounded ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {cat === "All"
                ? "All"
                : cat
                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                    .replace(/([A-Z])/g, (m) => m.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-4 gap-3">
          {products
            .filter((p) =>
              selectedCategory === "All"
                ? true
                : p.category === selectedCategory
            )
            .map((product) => (
              <button
                key={product.id}
                onClick={() => addProductToOrder(product)}
                className="border rounded p-2 hover:bg-gray-100"
              >
                <img
                  src={product.imageUrl || "/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-24 object-cover rounded"
                />
                <div className="text-center mt-2 font-medium">
                  {product.name}
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Right: Order Panel */}
      <div className="col-span-4 space-y-4">
        <div className="border rounded p-3 space-y-3 bg-white">
          <h2 className="font-semibold text-lg">Current Order</h2>

          {orderItems.map((item, index) => (
            <div key={index} className="border-b pb-2">
              <div className="flex justify-between">
                <strong>{item.product.name}</strong>
                <button onClick={() => removeItem(index)}>
                  <Trash size={16} className="text-red-600" />
                </button>
              </div>

              {/* Variant Select */}
              <select
                value={item.variant.id}
                onChange={(e) => updateVariant(index, e.target.value)}
                className="mt-1 border w-full p-1"
              >
                {item.product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - P{v.price.toFixed(2)}
                  </option>
                ))}
              </select>

              {/* Quantity */}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => updateItemQuantity(index, -1)}>
                  <Minus size={16} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateItemQuantity(index, 1)}>
                  <Plus size={16} />
                </button>
              </div>

              {/* Addons */}
              <div className="mt-2">
                <label className="text-sm">Addons:</label>
                <select
                  onChange={(e) => updateAddon(index, e.target.value, 1)}
                  className="w-full mt-1 border p-1"
                >
                  <option value="">Select addon</option>
                  {addons.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (P{a.price.toFixed(2)})
                    </option>
                  ))}
                </select>

                {/* Added addons */}
                <ul className="text-xs mt-1 space-y-1">
                  {item.addons.map((a) => (
                    <li key={a.addon.id} className="flex justify-between">
                      {a.addon.name} x{a.quantity}
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            updateAddon(index, a.addon.id, a.quantity - 1)
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          onClick={() =>
                            updateAddon(index, a.addon.id, a.quantity + 1)
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div className="text-right font-bold text-lg">
            Total: P{calculateTotal().toFixed(2)}
          </div>
        </div>

        {/* Payment */}
        <div className="flex space-x-10">
          <div className="font-bold text-2xl">Payment: P{payment || "0"}</div>
          <div className="font-bold text-2xl">
            Change: ₱
            {Math.max(0, parseFloat(payment || "0") - calculateTotal()).toFixed(
              2
            )}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(n)}
              disabled={orderItems.length === 0}
              className={`p-4 text-lg rounded ${
                orderItems.length === 0
                  ? "bg-gray-100 text-gray-400"
                  : "bg-gray-200 active:bg-gray-300"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={clearPayment}
            disabled={orderItems.length === 0}
            className={`p-4 rounded ${
              orderItems.length === 0
                ? "bg-red-100 text-gray-400"
                : "bg-red-200 active:bg-red-300"
            }`}
          >
            Clear
          </button>
          <button
            onClick={deleteDigit}
            disabled={orderItems.length === 0}
            className={`p-4 rounded ${
              orderItems.length === 0
                ? "bg-yellow-100 text-gray-400"
                : "bg-yellow-200 active:bg-yellow-300"
            }`}
          >
            ←
          </button>
        </div>

        <button
          onClick={() => {
            if (!isPaymentSufficient) {
              alert("Payment is not enough.");
              return;
            }
            setShowDialog(true);
          }}
          disabled={!isPaymentSufficient || orderItems.length === 0}
          className={`w-full py-3 rounded ${
            !isPaymentSufficient || orderItems.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white"
          }`}
        >
          Done
        </button>
      </div>

      {/* Review Modal */}
      <OrderConfirmationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="Review Order"
      >
        <div className="space-y-2 text-sm">
          {orderItems.map((item, index) => (
            <div key={index}>
              <strong>
                {item.product.name} ({item.variant.name}) x{item.quantity}
              </strong>
              <ul className="ml-4 list-disc">
                {item.addons.map((a) => (
                  <li key={a.addon.id}>
                    {a.addon.name} x{a.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p>Total: ${calculateTotal().toFixed(2)}</p>
          <p>Paid: ${payment || "0"}</p>
          <p>
            Change: $
            {Math.max(0, parseFloat(payment || "0") - calculateTotal()).toFixed(
              2
            )}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowDialog(false)}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmOrder}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Confirm
          </button>
        </div>
      </OrderConfirmationDialog>
    </div>
  );
}
