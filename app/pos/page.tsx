/* eslint-disable @next/next/no-img-element */
"use client";

import { JSX, useCallback, useEffect, useState } from "react";
import { Plus, Minus, Trash, Check } from "lucide-react";
import OrderConfirmationDialog from "@/components/order-confirmation-dialog";
import CustomSelect from "@/components/custom-select";
import { useToast } from "@/components/toast-context";
import { useData } from "@/lib/data-context";
import {
  LayoutGrid,
  Utensils,
  Coffee,
  Candy,
  ChevronLeft,
  X,
} from "lucide-react";
import LongPressServeButton from "@/components/long-press-serve-button";

// Type definitions
type Category = "InsideMeals" | "OutsideSnacks" | "InsideBeverages";
type OrderType = "DINE_IN" | "TAKE_OUT";

interface Flavor {
  id: string;
  name: string;
}

interface Size {
  id: string;
  name: string;
  price: number;
}

interface Addon {
  id: string;
  name: string;
  price: number;
}

interface ProductType {
  id: string;
  name: string;
  category: Category;
  imageUrl?: string;
}

interface Order {
  id: string;
  orderType: OrderType;
  orderStatus: string;
}

type ProductWithFlavorsAndSizes = ProductType & {
  flavors: Flavor[];
  sizes: Size[];
};

type OrderAddon = {
  addon: Addon;
  quantity: number;
};

type OrderItem = {
  product: ProductWithFlavorsAndSizes;
  flavor: Flavor;
  size: Size;
  quantity: number;
  addons: OrderAddon[];
};

type QueuedOrder = Order & {
  items: {
    product: ProductType;
    flavor: Flavor;
    size: Size;
    quantity: number;
    addons: { addon: Addon; quantity: number }[];
  }[];
};

export default function POSPage() {
  const {
    products,
    addons,
    orders: allOrders,
    loadOrders,
    createOrder,
    updateOrder,
  } = useData();
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">(
    "All"
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [orderType, setOrderType] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // New state for product selection flow
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithFlavorsAndSizes | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);

  const categories: (Category | "All")[] = [
    "All",
    "InsideMeals",
    "InsideBeverages",
    "OutsideSnacks",
  ];

  const [isOrderPanelVisible, setIsOrderPanelVisible] = useState(false);

  const { showToast } = useToast();

  // Filter orders to show only queuing ones for the current order type
  const orders = allOrders.filter((o: any) => o.orderStatus === "QUEUING");

  const categoryIcons: Record<string, JSX.Element> = {
    All: <LayoutGrid size={18} className="shrink-0 text-green-800" />,
    InsideMeals: <Utensils size={18} className="shrink-0 text-green-800" />,
    InsideBeverages: <Coffee size={18} className="shrink-0 text-green-800" />,
    OutsideSnacks: <Candy size={18} className="shrink-0 text-green-800" />,
  };

  useEffect(() => {
    if (orderType) {
      loadOrders();
    }
  }, [orderType, loadOrders]);

  useEffect(() => {
    console.log("Products loaded:", products);
  }, [products]);

  useEffect(() => {
    console.log("Order type changed:", orderType);
  }, [orderType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".product-selection-dropdown")) {
        setSelectedProduct(null);
        setSelectedFlavor(null);
        setSelectedSize(null);
      }
    };

    if (selectedProduct) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectedProduct]);

  const handleProductClick = (product: ProductWithFlavorsAndSizes) => {
    console.log("Product clicked:", product);
    console.log("Product has flavors:", product.flavors);
    console.log("Product has sizes:", product.sizes);
    setSelectedProduct(product);
    setSelectedFlavor(null);
    setSelectedSize(null);
  };

  const handleFlavorSelect = (flavor: Flavor) => {
    setSelectedFlavor(flavor);
    setSelectedSize(null);
  };

  const handleSizeSelect = (size: Size) => {
    setSelectedSize(size);
  };

  const addToCart = () => {
    if (!selectedProduct || !selectedFlavor || !selectedSize) return;

    const existingIndex = orderItems.findIndex(
      (item) =>
        item.product.id === selectedProduct.id &&
        item.flavor.id === selectedFlavor.id &&
        item.size.id === selectedSize.id
    );

    if (existingIndex !== -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          product: selectedProduct,
          flavor: selectedFlavor,
          size: selectedSize,
          quantity: 1,
          addons: [],
        },
      ]);
    }

    // Reset selection
    setSelectedProduct(null);
    setSelectedFlavor(null);
    setSelectedSize(null);
  };

  const cancelSelection = () => {
    setSelectedProduct(null);
    setSelectedFlavor(null);
    setSelectedSize(null);
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

  const updateFlavor = (index: number, flavorId: string) => {
    const items = [...orderItems];
    const flavor = items[index].product.flavors.find((f) => f.id === flavorId);
    if (flavor) {
      items[index].flavor = flavor;
      setOrderItems(items);
    }
  };

  const updateSize = (index: number, sizeId: string) => {
    const items = [...orderItems];
    const size = items[index].product.sizes.find((s) => s.id === sizeId);
    if (size) {
      items[index].size = size;
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
      const productTotal = item.size.price * item.quantity;
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
    try {
      const orderData = {
        items: orderItems.map((item) => ({
          product: item.product,
          flavor: item.flavor,
          size: item.size,
          quantity: item.quantity,
          status: "QUEUING",
          addons: item.addons.map((a) => ({
            addon: a.addon,
            quantity: a.quantity,
          })),
        })),
        total: calculateTotal(),
        paid: parseFloat(payment || "0"),
        change: parseFloat(payment || "0") - calculateTotal(),
        orderType,
      };

      if (editingOrderId) {
        await updateOrder(editingOrderId, orderData);
        showToast("Order updated.", "success");
      } else {
        await createOrder(orderData);
        showToast("Order placed.", "success");
      }

      setOrderItems([]);
      setPayment("");
      setShowDialog(false);
      setEditingOrderId(null);
      setIsOrderPanelVisible(false);
      
      // Refresh orders list
      await loadOrders();

      setTimeout(() => {
        setOrderType("");
      }, 2000);
    } catch (error) {
      showToast("Failed to process order.", "error");
      console.error("Order error:", error);
    }
  };

  const handleServe = async (id: string) => {
    try {
      await updateOrder(id, { orderStatus: "SERVED" });
      await loadOrders(); // Refresh orders list
      showToast("Order served successfully.", "success");
    } catch (error) {
      showToast("Failed to serve order.", "error");
      console.error("Serve order error:", error);
    }
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

  useEffect(() => {
    if (orderItems.length > 0) {
      setIsOrderPanelVisible(true);
    }
  }, [orderItems]);

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
    <>
      {orderType ? (
        <div className="p-4 flex gap-4 relative">
          <button
            onClick={() => setIsOrderPanelVisible(true)}
            className="absolute top-10 right-0 py-4 px-6 shadow-lg rounded-l-xl border border-red-300 bg-gradient-to-l from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 z-40"
          >
            <ChevronLeft color="white" size={20} />
          </button>
          <div
            className={`
    flex flex-col w-full overflow-x-auto gap-y-10
    transition-all duration-300 ease-in-out

  `}
          >
            {/* Product List */}
            <div className="col-span-8 space-y-4 min-h-screen">
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

              <div className="flex flex-wrap gap-3 h-full">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="relative  h-max">
                      <button
                        onClick={() => handleProductClick(product)}
                        className={`border border-zinc-300 rounded-md p-2 hover:bg-gray-100 w-[200px] ${
                          selectedProduct?.id === product.id
                            ? "ring-2 ring-blue-500 bg-blue-50"
                            : ""
                        }`}
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

                      {/* Flavor Selection Dropdown */}
                      {selectedProduct?.id === product.id && (
                        <div className="product-selection-dropdown absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 p-4 mt-1">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Choose Flavor:
                              </label>
                              {product.flavors && product.flavors.length > 0 ? (
                                <select
                                  value={selectedFlavor?.id || ""}
                                  onChange={(e) => {
                                    const flavor = product.flavors?.find(
                                      (f) => f.id === e.target.value
                                    );
                                    if (flavor) handleFlavorSelect(flavor);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select a flavor...</option>
                                  {product.flavors.map((flavor) => (
                                    <option key={flavor.id} value={flavor.id}>
                                      {flavor.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-red-500 text-sm">
                                  No flavors available for this product
                                </div>
                              )}
                            </div>

                            {/* Size Selection Buttons */}
                            {selectedFlavor && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Choose Size:
                                </label>
                                {product.sizes && product.sizes.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-2">
                                    {product.sizes.map((size) => (
                                      <button
                                        key={size.id}
                                        onClick={() => handleSizeSelect(size)}
                                        className={`px-3 py-2 rounded border text-center ${
                                          selectedSize?.id === size.id
                                            ? "bg-green-100 border-green-300 text-green-800"
                                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                        }`}
                                      >
                                        <div className="font-medium">
                                          {size.name}
                                        </div>
                                        <div className="text-sm">
                                          ₱{size.price.toFixed(2)}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-red-500 text-sm">
                                    No sizes available for this product
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            {selectedSize && (
                              <div className="flex gap-2 pt-2 border-t">
                                <button
                                  onClick={cancelSelection}
                                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={addToCart}
                                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
            className={` overflow-y-auto
    fixed top-0 right-0 h-full w-[600px] p-3 z-50 
    bg-gray-50 border-l border-zinc-300
    shadow-lg flex flex-col justify-between space-y-4
    transform transition-transform duration-300 ease-in-out
    ${
      isOrderPanelVisible
        ? "translate-x-0"
        : "translate-x-full pointer-events-none"
    }
  `}
          >
            <button
              onClick={() => setIsOrderPanelVisible(false)}
              className="absolute z-[99] right-6 top-6 p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-300 shadow-lg transition-all duration-200"
            >
              <X color="white" size={18} />
            </button>
            <div className="flex flex-col">
              <div className="border border-b-0 rounded-t-md p-3 space-y-3 bg-white border-gray-300 overflow-y-auto h-[600px] relative">
                <h2 className="font-semibold text-lg mb-12">Current Order</h2>

                {orderItems.length ? (
                  <>
                    {" "}
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="border p-3 bg-gray-50 rounded-md border-zinc-300 pb-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-base">
                              {item.product?.name || 'Unknown Product'}
                            </strong>
                            <div className="flex gap-2 mt-1">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {item.flavor?.name || 'Unknown Flavor'}
                              </span>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                {item.size?.name || 'Unknown Size'} - ₱{item.size?.price?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                          <button onClick={() => removeItem(index)}>
                            <Trash size={16} className="text-red-600" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-sm">Flavor:</label>
                            <CustomSelect
                              value={item.flavor.id}
                              onChange={(val) => updateFlavor(index, val)}
                              options={item.product.flavors.map((f) => ({
                                label: f.name,
                                value: f.id,
                              }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm">Size:</label>
                            <CustomSelect
                              value={item.size.id}
                              onChange={(val) => updateSize(index, val)}
                              options={item.product.sizes.map((s) => ({
                                label: `${s.name} - ₱${s.price.toFixed(2)}`,
                                value: s.id,
                              }))}
                            />
                          </div>
                        </div>

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
                                {a.addon?.name || 'Unknown Addon'} - ₱{a.addon?.price || 0}
                                <div className="flex gap-1 items-center">
                                  <button
                                    className="p-1 border bg-white border-zinc-300 rounded-md"
                                    onClick={() =>
                                      updateAddon(
                                        index,
                                        a.addon.id,
                                        a.quantity - 1
                                      )
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
                                      updateAddon(
                                        index,
                                        a.addon.id,
                                        a.quantity + 1
                                      )
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
                  </>
                ) : (
                  <div className="flex items-center w-full h-full border-dashed border-zinc-300 bg-zinc-100 rounded-lg">
                    <p className="text-[48px] text-center   w-full font-semibold text-zinc-400">
                      No orders yet.
                    </p>
                  </div>
                )}
              </div>
              <div className="font-bold text-[24px] bg-white p-3 text-center border border-zinc-300 rounded-b-md">
                Total: ₱{calculateTotal().toFixed(2)}
              </div>
            </div>

            {/* Payment Section */}
            <div>
              <div className="flex gap-10 flex-col">
                <div className="flex space-x-26 p-3 border border-zinc-300 rounded-md bg-white">
                  <div className="font-bold text-2xl">
                    <span className="text-base font-medium">Payment:</span>{" "}
                    <br /> ₱{payment || "0"}
                  </div>
                  <div className="font-bold text-2xl">
                    <span className="text-base font-medium">Change:</span>{" "}
                    <br />₱
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
                      orderItems.length === 0
                        ? "opacity-30 cursor-not-allowed"
                        : ""
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
                    orderItems.length === 0
                      ? "opacity-30 cursor-not-allowed"
                      : ""
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
                    orderItems.length === 0
                      ? "opacity-30 cursor-not-allowed"
                      : ""
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
                    {item.product?.name || 'Unknown Product'} ({item.flavor?.name || 'Unknown Flavor'} - {item.size?.name || 'Unknown Size'})
                    x{item.quantity}
                  </strong>
                  <ul className="ml-4 list-disc">
                    {item.addons?.map((a) => (
                      <li key={a.addon?.id || index}>
                        {a.addon?.name || 'Unknown Addon'} ₱{a.addon?.price || 0} x{a.quantity}
                      </li>
                    )) || []}
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
      ) : (
        <div className="w-full p-10 h-screen flex flex-col items-center justify-center gap-16 -mt-32">
          <div className="col-span-12 w-full border rounded-md border-zinc-300">
            <div className="p-4 border-b border-zinc-300 flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                Queing Orders
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 p-3 bg-zinc-100 min-h-[160px]">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-zinc-300 rounded-lg w-64 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 h-max"
                  >
                    <div className="mb-1 px-4 py-3 border-b border-zinc-300 flex items-center justify-between">
                      <span className="font-semibold text-gray-700">
                        #{order.id.slice(0, 6)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-10 p-3">
                      <div className="font-medium flex flex-col gap-4">
                        {order.items?.map((item, index) => (
                          <div key={index}>
                            {item.product?.name || 'Unknown Product'} ({item.flavor?.name || 'Unknown Flavor'} -{" "}
                            {item.size?.name || 'Unknown Size'}) x{item.quantity}
                            {item.addons?.length > 0 && (
                              <ul className="text-xs mt-1 font-normal flex gap-1 flex-wrap">
                                {item.addons.map((a) => (
                                  <li
                                    key={a.addon?.id || index}
                                    className="bg-zinc-200 w-max px-2 py-1 rounded-md"
                                  >
                                    {a.addon?.name || 'Unknown Addon'} x{a.quantity}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )) || []}
                      </div>

                      <div className="flex justify-between gap-1">
                        <LongPressServeButton
                          onConfirm={() => handleServe(order.id)}
                          idleLabel="Mark as Served"
                          confirmingLabel="Keep holding…"
                          successLabel="Served!"
                          holdMs={2000} // 2 seconds
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full flex flex-col items-center justify-center text-center text-zinc-500 py-10 mx-auto">
                  <div className="mb-3 p-3 rounded-full bg-zinc-100 text-zinc-600">
                    📦
                  </div>
                  <p className="text-lg font-medium">No orders queuing</p>
                  <p className="text-sm text-zinc-400">
                    Orders will appear here once added.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Welcome to Papa Bear Cafe
            </h1>
            <p className="text-2xl text-gray-600 font-medium">
              Choose your order type to get started
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            {/* Dine In Button */}
            <button
              onClick={() => {
                console.log("Dine In clicked");
                setOrderType("DINE_IN");
              }}
              className="group relative overflow-hidden bg-green-500/10 w-[280px] rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 group-hover:bg-white group-hover:bg-none p-4 rounded-xl transition-all duration-300">
                  <Utensils
                    size={48}
                    className="text-white group-hover:text-green-600"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-800 group-hover:text-white transition-colors duration-300">
                    Dine In
                  </h3>
                  <p className="text-lg text-gray-500 group-hover:text-white/80 transition-colors duration-300 mt-2">
                    Enjoy your meal here
                  </p>
                </div>
              </div>
            </button>

            {/* Take Out Button */}
            <button
              onClick={() => {
                console.log("Take Out clicked");
                setOrderType("TAKE_OUT");
              }}
              className="group relative overflow-hidden bg-orange-500/10 w-[280px] rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 group-hover:bg-white group-hover:bg-none p-4 rounded-xl transition-all duration-300">
                  <Coffee
                    size={48}
                    className="text-white group-hover:text-orange-600"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-800 group-hover:text-white transition-colors duration-300">
                    Take Out
                  </h3>
                  <p className="text-lg text-gray-500 group-hover:text-white/80 transition-colors duration-300 mt-2">
                    Order to go
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
