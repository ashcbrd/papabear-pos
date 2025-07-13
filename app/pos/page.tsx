/* eslint-disable @next/next/no-img-element */
"use client";

import { JSX, useCallback, useEffect, useState } from "react";
import {
  Category,
  Variant,
  Addon,
  Product as ProductType,
  Order,
  OrderType,
} from "@prisma/client";
import { Plus, Minus, Trash } from "lucide-react";
import OrderConfirmationDialog from "@/components/order-confirmation-dialog";
import CustomSelect from "@/components/custom-select";
import { useToast } from "@/components/toast-context";
import { LayoutGrid, Utensils, Coffee, Candy } from "lucide-react";
import Logo from "@/components/logo";

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

type QueuedOrder = Order & {
  items: {
    product: ProductType;
    variant: Variant;
    quantity: number;
    addons: { addon: Addon; quantity: number }[];
  }[];
};

export default function POSPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [orders, setOrders] = useState<QueuedOrder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">(
    "All"
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const categories: (Category | "All")[] = [
    "All",
    "InsideMeals",
    "InsideBeverages",
    "OutsideSnacks",
  ];

  const { showToast } = useToast();

  const categoryIcons: Record<string, JSX.Element> = {
    All: <LayoutGrid size={18} className="shrink-0 text-green-800" />,
    InsideMeals: <Utensils size={18} className="shrink-0 text-green-800" />,
    InsideBeverages: <Coffee size={18} className="shrink-0 text-green-800" />,
    OutsideSnacks: <Candy size={18} className="shrink-0 text-green-800" />,
  };

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
    fetch("/api/addons")
      .then((res) => res.json())
      .then(setAddons);
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.filter((o: Order) => o.orderStatus === "QUEUING"));
  };

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
    setPayment((prev) => {
      if (digit === "." && prev.includes(".")) return prev;
      if (digit === "." && prev === "") return "0.";
      if (/^0+$/.test(prev) && digit !== "." && digit !== "0") return digit;

      const [intPart, decPart] = prev.split(".");

      if (!prev.includes(".")) {
        if (intPart.length >= 4 && digit !== ".") return prev;
      } else {
        if (digit !== "." && decPart?.length >= 2) return prev;
      }

      return prev + digit;
    });
  };

  const clearPayment = () => setPayment("");
  const deleteDigit = useCallback(() => {
    setPayment((prev) => prev.slice(0, -1));
  }, []);

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
      orderType,
    };

    const url = editingOrderId
      ? `/api/orders/${editingOrderId}`
      : "/api/orders";
    const method = editingOrderId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOrderItems([]);
      setPayment("");
      setShowDialog(false);
      setEditingOrderId(null);
      fetchOrders();
      showToast(editingOrderId ? "Order updated." : "Order placed.", "success");
    }
  };

  const handleServe = async (id: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: "SERVED" }),
    });
    fetchOrders();
    showToast("Order served successfully.", "success");
  };

  // const handleDelete = async (id: string) => {
  //   await fetch(`/api/orders/${id}`, { method: "DELETE" });
  //   if (editingOrderId === id) {
  //     setOrderItems([]);
  //     setPayment("");
  //     setEditingOrderId(null);
  //   }
  //   fetchOrders();
  // };

  // const handleEdit = (order: QueuedOrder) => {
  //   setEditingOrderId(order.id);
  //   setOrderType(order.orderType);
  //   setPayment(order.paid.toFixed(2));
  //   setOrderItems(
  //     order.items.map((item) => ({
  //       product: products.find((p) => p.id === item.product.id)!,
  //       variant: item.variant,
  //       quantity: item.quantity,
  //       addons: item.addons.map((a) => ({
  //         addon: a.addon,
  //         quantity: a.quantity,
  //       })),
  //     }))
  //   );
  // };

  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === "All" || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const keycapButtonClass = `
  relative w-full h-[80px] rounded-[10px]
  bg-gradient-to-b from-[#282828] to-[#202020]
  shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),10px_20px_25px_rgba(0,0,0,0.4)]
  overflow-hidden transition-all duration-100
  active:translate-y-[2px]
  active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),5px_10px_15px_rgba(0,0,0,0.3)]
`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "." && payment.includes(".")) return;
      if (orderItems.length === 0) return;

      if (/^\d$/.test(e.key) || e.key === ".") {
        handleDigit(e.key);

        const btn = document.querySelector(`[data-key="${e.key}"]`);
        if (btn) {
          btn.classList.add("pressed");
          setTimeout(() => btn.classList.remove("pressed"), 150);
        }
      } else if (e.key === "Backspace") {
        deleteDigit();
        const btn = document.querySelector(`[data-key="Backspace"]`);
        if (btn) {
          btn.classList.add("pressed");
          setTimeout(() => btn.classList.remove("pressed"), 150);
        }
      } else if (e.key === "Enter") {
        if (!isPaymentSufficient) {
          showToast("Payment is not enough.", "error");

          return;
        }
        setShowDialog(true);
        const btn = document.querySelector(`[data-key="Enter"]`);
        if (btn) {
          btn.classList.add("pressed");
          setTimeout(() => btn.classList.remove("pressed"), 150);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orderItems, payment, isPaymentSufficient, deleteDigit]);

  const isOrderPanelVisible = () => {
    return orderItems.length > 0;
  };

  const formatOrderType = (type: OrderType) => {
    switch (type) {
      case "DINE_IN":
        return "Dine In";
      case "TAKE_OUT":
        return "Take Out";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="p-4 flex gap-4 relative">
      <div
        className={`
    flex flex-col w-full overflow-x-auto gap-y-10
    transition-all duration-300 ease-in-out
    ${isOrderPanelVisible() ? "mr-[500px]" : "mr-0"}
  `}
      >
        <div className="col-span-12 border rounded-md border-zinc-300">
          <h2 className="text-xl font-semibold p-3 border-b border-zinc-300">
            Queuing Orders
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 p-3 bg-zinc-100 min-h-[160px]">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-zinc-300 rounded-md w-60 bg-white h-max"
                >
                  <div className="mb-1 px-3 py-1 border-b border-zinc-300 flex items-center justify-between">
                    #{order.id.slice(0, 6)}{" "}
                    <div className="text-xs text-zinc-500">
                      {formatOrderType(order.orderType)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-10 p-3">
                    <div className="font-medium flex flex-col gap-4">
                      {order.items.map((item) => (
                        <div key={item.variant.id}>
                          {item.product.name} ({item.variant.name}) x
                          {item.quantity}
                          {item.addons.length > 0 && (
                            <ul className="text-xs mt-1 font-normal flex gap-1 flex-wrap">
                              {item.addons.map((a) => (
                                <li
                                  key={a.addon.id}
                                  className="bg-zinc-200 w-max px-2 py-1 rounded-md"
                                >
                                  {a.addon.name} x{a.quantity}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between gap-1">
                      <button
                        onClick={() => handleServe(order.id)}
                        className="border border-zinc-200 text-white w-full bg-green-800 px-6 py-2 rounded-lg font-semibold text-lg"
                      >
                        Serve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full flex flex-col items-center justify-center text-center text-zinc-500 py-10 mx-auto">
                <p className="text-lg font-medium">No queuing orders</p>
                <p className="text-sm text-zinc-400">
                  Orders will appear here once added.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="col-span-8 space-y-4">
          <div className="flex flex-col mb-4 w-max">
            {/* Category Buttons */}
            <div className="flex gap-2 p-1 rounded-xl border border-zinc-300 bg-gray-100 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as Category)}
                  className={`py-2 px-4 flex items-center gap-2 rounded-lg tracking-wide ${
                    selectedCategory === cat
                      ? "bg-white border border-zinc-300"
                      : "bg-none"
                  }`}
                >
                  {categoryIcons[cat]}
                  {cat === "All"
                    ? "All"
                    : cat.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase()}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-zinc-300 rounded-md"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProductToOrder(product)}
                  className="border border-zinc-300 rounded-md p-2 hover:bg-gray-100 w-[200px]"
                >
                  <img
                    src={product.imageUrl || "/placeholder.jpg"}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded"
                  />
                  <div className="text-center mt-2 font-medium">
                    {product.name}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center w-full text-zinc-500 p-10 col-span-full">
                No products found for this category or search.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Panel */}
      <div
        className={`
    fixed top-0 right-0 h-screen w-[500px] p-3 z-50 
    bg-gray-50 border-l border-zinc-300
    shadow-lg flex flex-col justify-between space-y-4
    transform transition-transform duration-300 ease-in-out
    ${
      isOrderPanelVisible()
        ? "translate-x-0"
        : "translate-x-full pointer-events-none"
    }
  `}
      >
        <div className="flex flex-col">
          <div className="border border-b-0 rounded-t-md p-3 space-y-3 bg-white border-gray-300 overflow-y-auto max-h-[500px] relative">
            <h2 className="font-semibold text-lg">Current Order</h2>

            <CustomSelect
              value={orderType}
              onChange={setOrderType}
              options={[
                { label: "Dine In", value: "DINE_IN" },
                { label: "Take Out", value: "TAKE_OUT" },
              ]}
            />

            {orderItems.map((item, index) => (
              <div
                key={index}
                className="border p-3 bg-gray-50 rounded-md border-zinc-300 pb-2"
              >
                <div className="flex justify-between">
                  <strong>{item.product.name}</strong>
                  <button onClick={() => removeItem(index)}>
                    <Trash size={16} className="text-red-600" />
                  </button>
                </div>
                <label className="text-sm">Variant:</label>
                <CustomSelect
                  value={item.variant.id}
                  onChange={(val) => updateVariant(index, val)}
                  options={item.product.variants.map((v) => ({
                    label: `${v.name} - ₱${v.price.toFixed(2)}`,
                    value: v.id,
                  }))}
                />

                <div className="flex items-center gap-2 mt-2">
                  <button
                    className="p-1 border bg-white border-zinc-300 rounded-md"
                    onClick={() => updateItemQuantity(index, -1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="p-1 border bg-white border-zinc-300 rounded-md"
                    onClick={() => updateItemQuantity(index, 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="mt-2">
                  <label className="text-sm">Addons:</label>
                  <CustomSelect
                    value=""
                    onChange={(val) => updateAddon(index, val, 1)}
                    options={addons.map((a) => ({
                      label: `${a.name} (₱${a.price.toFixed(2)})`,
                      value: a.id,
                    }))}
                    placeholder="Select addon"
                  />

                  <ul className="text-xs mt-1 space-y-1">
                    {item.addons.map((a) => (
                      <li
                        key={a.addon.id}
                        className="flex justify-between items-center"
                      >
                        {a.addon.name} - ₱{a.addon.price}
                        <div className="flex gap-1 items-center">
                          <button
                            className="p-1 border bg-white border-zinc-300 rounded-md"
                            onClick={() =>
                              updateAddon(index, a.addon.id, a.quantity - 1)
                            }
                          >
                            <Minus size={14} />
                          </button>
                          <p className="w-6 text-center text-xs">
                            {" "}
                            {a.quantity}
                          </p>
                          <button
                            className="p-1 border bg-white border-zinc-300 rounded-md"
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
          </div>
          <div className="font-bold text-3xl bg-white p-3 text-center border border-zinc-300 rounded-b-md">
            Total: ₱{calculateTotal().toFixed(2)}
          </div>
        </div>

        {/* Payment Section */}
        <div>
          <div className="flex gap-10 flex-col">
            <div className="flex space-x-26 p-3 border border-zinc-300 rounded-md bg-white">
              <div className="font-bold text-2xl">
                <span className="text-base font-medium">Payment:</span> <br /> ₱
                {payment || "0"}
              </div>
              <div className="font-bold text-2xl">
                <span className="text-base font-medium">Change:</span> <br />₱
                {Math.max(
                  0,
                  parseFloat(payment || "0") - calculateTotal()
                ).toFixed(2)}
              </div>
            </div>
            <div className="flex gap-2 w-full mb-4">
              {/* Clear button - Red themed */}
              <button
                onClick={clearPayment}
                disabled={orderItems.length === 0}
                className={`
      relative w-full h-[80px] rounded-[10px]
      bg-gradient-to-b from-[#5a1e1e] to-[#3a1212]
      shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),8px_15px_20px_rgba(0,0,0,0.4)]
      overflow-hidden transition-all duration-100
      active:translate-y-[2px]
      active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),4px_8px_12px_rgba(0,0,0,0.3)]
      ${orderItems.length === 0 ? "opacity-30 cursor-not-allowed" : ""}
    `}
              >
                <div
                  className="absolute top-[3px] left-[4px] right-[12px] bottom-[14px]
      bg-gradient-to-r from-[#a94444] to-[#ff6666]
      rounded-[10px]
      shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)]
      border-l border-b border-t border-black/30 pointer-events-none transition-all duration-100
      group-active:top-[5px] group-active:left-[5px] group-active:bottom-[11px] group-active:right-[11px]
    "
                ></div>
                <h6 className="absolute top-[12px] left-[12px] text-white text-[26px] font-medium">
                  Clear
                </h6>
              </button>

              {/* Delete button - Yellow themed */}
              <button
                onClick={deleteDigit}
                data-key="Backspace"
                disabled={orderItems.length === 0}
                className={`
      relative w-full h-[80px] rounded-[10px]
      bg-gradient-to-b from-[#7a5d14] to-[#4a3a0a]
      shadow-[inset_-8px_0_8px_rgba(0,0,0,0.15),inset_0_-8px_8px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),8px_15px_20px_rgba(0,0,0,0.4)]
      overflow-hidden transition-all duration-100
      active:translate-y-[2px]
      active:shadow-[inset_-4px_0_4px_rgba(0,0,0,0.1),inset_0_-4px_4px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),4px_8px_12px_rgba(0,0,0,0.3)]
      ${orderItems.length === 0 ? "opacity-30 cursor-not-allowed" : ""}
    `}
              >
                <div
                  className="absolute top-[3px] left-[4px] right-[12px] bottom-[14px]
      bg-gradient-to-r from-[#ffd966] to-[#f5c232]
      rounded-[10px]
      shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)]
      border-l border-b border-t border-black/30 pointer-events-none transition-all duration-100
      group-active:top-[5px] group-active:left-[5px] group-active:bottom-[11px] group-active:right-[11px]
    "
                ></div>
                <h6 className="absolute top-[12px] left-[12px] text-white text-[26px] font-medium">
                  ←
                </h6>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-2 w-full">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
              <button
                key={n}
                data-key={n}
                onClick={() => handleDigit(n)}
                disabled={orderItems.length === 0}
                className={`${keycapButtonClass} ${
                  orderItems.length === 0 ? "opacity-30 cursor-not-allowed" : ""
                }`}
              >
                <div className="absolute top-[3px] left-[4px] right-[12px] bottom-[14px] bg-gradient-to-r from-[#232323] to-[#4a4a4a] rounded-[10px] shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] border-l border-b border-t border-black/30 pointer-events-none transition-all duration-100" />
                <h6 className="absolute top-[12px] left-[12px] text-[#e9e9e9] text-[26px] font-medium">
                  {n}
                </h6>
              </button>
            ))}

            {/* 0 spans 2 columns */}
            <button
              data-key="0"
              onClick={() => handleDigit("0")}
              disabled={orderItems.length === 0}
              className={`md:col-span-2 ${keycapButtonClass} ${
                orderItems.length === 0 ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              <div className="absolute top-[3px] left-[4px] right-[12px] bottom-[14px] bg-gradient-to-r from-[#232323] to-[#4a4a4a] rounded-[10px] shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] border-l border-b border-t border-black/30 pointer-events-none transition-all duration-100" />
              <h6 className="absolute top-[12px] left-[12px] text-[#e9e9e9] text-[26px] font-medium">
                0
              </h6>
            </button>

            {/* Period Button */}
            <button
              onClick={() => handleDigit(".")}
              data-key="."
              disabled={orderItems.length === 0}
              className={`${keycapButtonClass} ${
                orderItems.length === 0 ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              <div className="absolute top-[3px] left-[4px] right-[12px] bottom-[14px] bg-gradient-to-r from-[#232323] to-[#4a4a4a] rounded-[10px] shadow-[-10px_-10px_10px_rgba(255,255,255,0.25),10px_5px_10px_rgba(0,0,0,0.15)] border-l border-b border-t border-black/30 pointer-events-none transition-all duration-100" />
              <h6 className="absolute top-[12px] left-[12px] text-[#e9e9e9] text-[26px] font-medium">
                .
              </h6>
            </button>
          </div>

          {/* Enter / Done Button below grid */}
          <button
            data-key="Enter"
            onClick={() => {
              if (!isPaymentSufficient) {
                showToast("Payment is not enough.", "error");
                return;
              }
              setShowDialog(true);
            }}
            disabled={!isPaymentSufficient || orderItems.length === 0}
            className={`mt-4 relative w-full h-[80px] rounded-[10px]
    bg-gradient-to-b from-[#216e3a] to-[#124526]
    shadow-[inset_-6px_0_6px_rgba(0,0,0,0.15),inset_0_-6px_6px_rgba(0,0,0,0.25),0_0_0_2px_rgba(0,0,0,0.75),8px_15px_20px_rgba(0,0,0,0.4)]
    overflow-hidden transition-all duration-100
    active:translate-y-[2px]
    active:shadow-[inset_-3px_0_3px_rgba(0,0,0,0.1),inset_0_-3px_3px_rgba(0,0,0,0.15),0_0_0_2px_rgba(0,0,0,0.5),4px_8px_12px_rgba(0,0,0,0.3)]
    ${
      !isPaymentSufficient || orderItems.length === 0
        ? "opacity-30 cursor-not-allowed"
        : ""
    }`}
          >
            <div className="absolute top-[3px] left-[4px] right-[10px] bottom-[10px] bg-gradient-to-r from-[#5dd69c] to-[#3dbf84] rounded-[10px] shadow-[-6px_-6px_6px_rgba(255,255,255,0.25),6px_3px_6px_rgba(0,0,0,0.15)] border-l border-b border-t border-black/30 pointer-events-none transition-all duration-100" />
            <h6 className="absolute top-[12px] left-[12px] text-white text-[26px] font-medium">
              Done
            </h6>
          </button>
        </div>
      </div>

      <OrderConfirmationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="Review Order"
      >
        <div className="space-y-2 text-lg">
          {orderItems.map((item, index) => (
            <div key={index}>
              <strong>
                {item.product.name} ({item.variant.name}) x{item.quantity}
              </strong>
              <ul className="ml-4 list-disc">
                {item.addons.map((a) => (
                  <li key={a.addon.id}>
                    {a.addon.name} ₱{a.addon.price} x{a.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-4 flex p-3 rounded-md bg-gray-50 border border-zinc-300 justify-between">
            <p>Total: ₱{calculateTotal().toFixed(2)}</p>
            <p>Paid: ₱{payment || "0"}</p>
            <p>
              Change: ₱
              {Math.max(
                0,
                parseFloat(payment || "0") - calculateTotal()
              ).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowDialog(false)}
            className="px-4 py-2 border rounded-md text-xl border-zinc-300 text-zinc-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmOrder}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xl"
          >
            Confirm
          </button>
        </div>
      </OrderConfirmationDialog>
    </div>
  );
}
