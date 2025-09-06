/* eslint-disable @next/next/no-img-element */
"use client";

import { JSX, useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Minus,
  Trash,
  Search,
  ShoppingCart,
  Wallet,
  Package,
  Edit,
  X,
  LayoutGrid,
  Utensils,
  Coffee,
  Zap,
  ArrowLeft,
  Filter,
  ChevronDown,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import OrderConfirmationDialog from "@/components/order-confirmation-dialog";
import CustomSelect from "@/components/custom-select";
import { useToast } from "@/components/toast-context";
import { useData } from "@/lib/data-context";
import { formatDate } from "@/lib/date-utils";
import LongPressServeButton from "@/components/long-press-serve-button";

type Category = "Meals" | "ColdBeverages" | "HotBeverages";
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
  createdAt?: string;
  total?: number;
  items?: {
    product: ProductType;
    flavor: Flavor;
    size: Size;
    quantity: number;
    addons: { addon: Addon; quantity: number }[];
  }[];
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

export default function ModernPOSPage() {
  const {
    products,
    addons,
    materials,
    ingredients,
    orders: allOrders,
    loadOrders,
    createOrder,
    updateOrder,
    getFlavorIngredients,
    currentDataService,
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
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithFlavorsAndSizes | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<OrderAddon[]>([]);
  const [isOrderPanelVisible, setIsOrderPanelVisible] = useState(false);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const [isStocksVisible, setIsStocksVisible] = useState(false);
  const [stockFilter, setStockFilter] = useState<
    "all" | "good" | "low" | "out"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "Material" | "Ingredient" | "Add-on"
  >("all");
  const [selectedProductForStock, setSelectedProductForStock] =
    useState<any>(null);
  const [selectedFlavorForStock, setSelectedFlavorForStock] =
    useState<any>(null);
  const [selectedSizeForStock, setSelectedSizeForStock] = useState<any>(null);
  const [productFilteredStockItems, setProductFilteredStockItems] = useState<
    any[]
  >([]);
  const [cashDrawerBalance, setCashDrawerBalance] = useState(0);
  const [orderStatusFilter, setOrderStatusFilter] = useState<"QUEUING" | "SERVED" | "CANCELLED" | "WRONG">("QUEUING");
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [showWrongConfirm, setShowWrongConfirm] = useState<string | null>(null);

  const sizeSelectionRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Filter orders based on status filter
  const orders: Order[] = allOrders.filter((o: Order) => {
    return o.orderStatus === orderStatusFilter;
  });

  const categories: (Category | "All")[] = [
    "All",
    "Meals",
    "ColdBeverages",
    "HotBeverages",
  ];

  const categoryIcons: Record<string, JSX.Element> = {
    All: <LayoutGrid size={18} className="text-green-600" />,
    Meals: <Utensils size={18} className="text-green-600" />,
    ColdBeverages: <Coffee size={18} className="text-green-600" />,
    HotBeverages: <Zap size={18} className="text-green-600" />,
  };

  useEffect(() => {
    // Load cash drawer balance on component mount
    loadCashDrawerBalance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Update filtered stock items when product selection changes
    const updateFilteredItems = async () => {
      const filtered = await getFilteredStockItemsByProduct();
      setProductFilteredStockItems(filtered);
    };
    updateFilteredItems();
  }, [selectedProductForStock, selectedSizeForStock, selectedFlavorForStock]);

  useEffect(() => {
    if (orderType) {
      loadOrders();
    }
  }, [orderType, loadOrders]);

  const loadCashDrawerBalance = useCallback(async () => {
    try {
      console.log("Loading cash drawer balance...");
      const balanceData = await currentDataService.getCashDrawerBalance();
      console.log("Cash drawer balance loaded:", balanceData.currentBalance);
      setCashDrawerBalance(balanceData.currentBalance);
    } catch (error) {
      console.error("❌ Error loading cash drawer balance:", error);
    }
  }, [currentDataService]);

  const getStockStatus = useCallback(
    (currentStock: number, reorderPoint: number = 10) => {
      if (currentStock === 0)
        return { status: "out", label: "Out of Stock", color: "red" };
      if (currentStock <= reorderPoint)
        return { status: "low", label: "Low Stock", color: "yellow" };
      return { status: "good", label: "Good Stock", color: "green" };
    },
    []
  );

  const getAllStockItems = useCallback(() => {
    const stockItems = [];

    // Add materials
    materials.forEach((material: any) => {
      const currentStock = material.stock?.quantity || 0;
      const stockInfo = getStockStatus(currentStock, 10);
      stockItems.push({
        id: material.id,
        name: material.name,
        type: "Material",
        currentStock: currentStock,
        unit: material.measurementUnit || "pcs",
        status: stockInfo.status,
        statusLabel: stockInfo.label,
        statusColor: stockInfo.color,
      });
    });

    // Add ingredients
    ingredients.forEach((ingredient: any) => {
      const currentStock = ingredient.stock?.quantity || 0;
      const stockInfo = getStockStatus(currentStock, 10);
      stockItems.push({
        id: ingredient.id,
        name: ingredient.name,
        type: "Ingredient",
        currentStock: currentStock,
        unit: ingredient.measurementUnit || "pcs",
        status: stockInfo.status,
        statusLabel: stockInfo.label,
        statusColor: stockInfo.color,
      });
    });

    // Add addons
    addons.forEach((addon: any) => {
      const currentStock = addon.stock?.quantity || 0;
      const stockInfo = getStockStatus(currentStock, 10);
      stockItems.push({
        id: addon.id,
        name: addon.name,
        type: "Add-on",
        currentStock: currentStock,
        unit: addon.measurementUnit || "pcs",
        status: stockInfo.status,
        statusLabel: stockInfo.label,
        statusColor: stockInfo.color,
      });
    });

    return stockItems;
  }, [materials, ingredients, addons, getStockStatus]);

  const getFilteredStockItemsByProduct = useCallback(async () => {
    if (!selectedProductForStock || !selectedSizeForStock) {
      return getAllStockItems().filter((item) => item.type !== "Add-on"); // Remove addons when no product selected
    }

    const filteredItems = [];

    // Get materials used by the selected size
    const sizeData = selectedSizeForStock;

    // Add materials used by this size
    if (sizeData.materials) {
      sizeData.materials.forEach((sizeMaterial: any) => {
        const material = materials.find(
          (m: any) => m.id === sizeMaterial.materialId
        );
        if (material) {
          const currentStock = material.stock?.quantity || 0;
          const stockInfo = getStockStatus(currentStock, 10);
          filteredItems.push({
            id: material.id,
            name: material.name,
            type: "Material",
            currentStock: currentStock,
            unit: material.measurementUnit || "pcs",
            quantityUsed: sizeMaterial.quantityUsed,
            status: stockInfo.status,
            statusLabel: stockInfo.label,
            statusColor: stockInfo.color,
          });
        }
      });
    }

    // Add ingredients used by this size
    if (sizeData.ingredients) {
      sizeData.ingredients.forEach((sizeIngredient: any) => {
        const ingredient = ingredients.find(
          (i: any) => i.id === sizeIngredient.ingredientId
        );
        if (ingredient) {
          const currentStock = ingredient.stock?.quantity || 0;
          const stockInfo = getStockStatus(currentStock, 10);
          filteredItems.push({
            id: ingredient.id,
            name: ingredient.name,
            type: "Ingredient",
            currentStock: currentStock,
            unit: ingredient.measurementUnit || "pcs",
            quantityUsed: sizeIngredient.quantityUsed,
            status: stockInfo.status,
            statusLabel: stockInfo.label,
            statusColor: stockInfo.color,
          });
        }
      });
    }

    // Add ingredients used by the selected flavor (if flavor is selected)
    if (selectedFlavorForStock) {
      try {
        const flavorIngredients = await getFlavorIngredients(
          selectedFlavorForStock.id
        );
        if (flavorIngredients && flavorIngredients.length > 0) {
          flavorIngredients.forEach((flavorIngredient: any) => {
            const ingredient = ingredients.find(
              (i: any) => i.id === flavorIngredient.ingredientId
            );
            if (ingredient) {
              // Check if this ingredient is already added from size
              const existingIndex = filteredItems.findIndex(
                (item) => item.id === ingredient.id
              );
              const currentStock = ingredient.stock?.quantity || 0;
              const stockInfo = getStockStatus(currentStock, 10);

              if (existingIndex >= 0) {
                // Update existing ingredient with flavor quantity
                filteredItems[existingIndex].quantityUsed +=
                  flavorIngredient.quantityUsed || 0;
              } else {
                // Add new ingredient from flavor
                filteredItems.push({
                  id: ingredient.id,
                  name: ingredient.name,
                  type: "Ingredient",
                  currentStock: currentStock,
                  unit: ingredient.measurementUnit || "pcs",
                  quantityUsed: flavorIngredient.quantityUsed || 0,
                  status: stockInfo.status,
                  statusLabel: stockInfo.label,
                  statusColor: stockInfo.color,
                });
              }
            }
          });
        }
      } catch (error) {
        console.error("Error getting flavor ingredients:", error);
      }
    }

    return filteredItems;
  }, [
    selectedProductForStock,
    selectedSizeForStock,
    selectedFlavorForStock,
    materials,
    ingredients,
    getStockStatus,
    getAllStockItems,
    getFlavorIngredients,
  ]);

  const handleProductClick = (product: ProductWithFlavorsAndSizes) => {
    setSelectedProduct(product);
    setSelectedFlavor(null);
    setSelectedSize(null);
    setSelectedAddons([]);

    // auto-select flavor if none available, but let user choose if flavors exist
    if (!product.flavors || product.flavors.length === 0) {
      setTimeout(
        () => setSelectedFlavor({ id: "default", name: "Default" }),
        50
      );
    }
    // For products with flavors (single or multiple), always show flavor selection
  };

  const handleFlavorSelect = (flavor: Flavor) => {
    setSelectedFlavor(flavor);
    setSelectedSize(null);
    setTimeout(() => {
      if (sizeSelectionRef.current) {
        sizeSelectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const handleSizeSelect = (size: Size) => setSelectedSize(size);

  const handleAddonChange = (addon: Addon, change: number) => {
    setSelectedAddons((prev) => {
      const existing = prev.find((a) => a.addon.id === addon.id);
      if (existing) {
        const newQuantity = Math.max(0, existing.quantity + change);
        if (newQuantity === 0) {
          return prev.filter((a) => a.addon.id !== addon.id);
        }
        return prev.map((a) =>
          a.addon.id === addon.id ? { ...a, quantity: newQuantity } : a
        );
      } else if (change > 0) {
        return [...prev, { addon, quantity: 1 }];
      }
      return prev;
    });
  };

  const addToCart = () => {
    if (!selectedProduct || !selectedFlavor || !selectedSize) return;

    const existingIndex = orderItems.findIndex(
      (item) =>
        item.product.id === selectedProduct.id &&
        item.flavor.id === selectedFlavor.id &&
        item.size.id === selectedSize.id &&
        JSON.stringify(item.addons) === JSON.stringify(selectedAddons)
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
          addons: selectedAddons,
        },
      ]);
    }

    setSelectedProduct(null);
    setSelectedFlavor(null);
    setSelectedSize(null);
    setSelectedAddons([]);
  };

  const cancelSelection = () => {
    setSelectedProduct(null);
    setSelectedFlavor(null);
    setSelectedSize(null);
    setSelectedAddons([]);
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

  const editItem = (index: number) => {
    const item = orderItems[index];
    if (!item) return;
    const items = [...orderItems];
    items.splice(index, 1);
    setOrderItems(items);
    setSelectedProduct(item.product);
    setSelectedFlavor(item.flavor);
    setSelectedSize(item.size);
    setSelectedAddons(item.addons);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const base = item.size.price * item.quantity;
      const addonTotal = item.addons.reduce(
        (sum, a) => sum + a.addon.price * a.quantity,
        0
      );
      return total + base + addonTotal;
    }, 0);
  };

  const isPaymentSufficient =
    parseFloat(payment || "0") >= (calculateTotal() || 0);

  const handleDigit = (digit: string) => {
    setPayment((prev) => {
      if (digit === "." && prev.includes(".")) return prev;
      if (digit === "." && prev === "") return "0.";
      if (/^0+$/.test(prev) && digit !== "." && digit !== "0") return digit;

      const [intPart, decPart] = prev.split(".");
      if (!prev.includes(".")) {
        if (intPart.length >= 6 && digit !== ".") return prev;
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

  const calculateOrderTotal = useCallback(() => {
    return orderItems.reduce((sum, item) => {
      const basePrice = item.size?.price || 0;
      const addonPrice = (item.addons || []).reduce(
        (addonSum, addon) =>
          addonSum + (addon.addon?.price || 0) * (addon.quantity || 0),
        0
      );
      return sum + (basePrice + addonPrice) * item.quantity;
    }, 0);
  }, [orderItems]);

  const handleConfirmOrder = async () => {
    const total = calculateOrderTotal();
    const paid = parseFloat(payment || "0");
    const change = Math.max(0, paid - total);

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
      total,
      paid,
      change,
      orderType,
      orderStatus: "QUEUING",
    };

    try {
      console.log("🔄 Creating order with data:", orderData);
      let createdOrderId = editingOrderId;
      if (editingOrderId) {
        console.log("📝 Updating existing order:", editingOrderId);
        await updateOrder(editingOrderId, orderData);
      } else {
        console.log("➕ Creating new order...");
        const newOrder = await createOrder(orderData);
        createdOrderId = newOrder.id;
        console.log("✅ New order created with ID:", createdOrderId);
      }

      // Cash flow transaction is now automatically handled by the createOrder service
      console.log("💰 Cash flow transaction handled automatically by order creation service");

      showToast(editingOrderId ? "Order updated." : "Order placed.", "success");

      // cleanup UI
      setOrderItems([]);
      setPayment("");
      setShowDialog(false);
      setEditingOrderId(null);
      setIsOrderPanelVisible(false);

      // refresh data
      await loadOrders();
      await loadCashDrawerBalance();

      setTimeout(() => setOrderType(""), 2000);
    } catch (error) {
      showToast("Failed to process order.", "error");
      console.error("Order error:", error);
    }
  };

  const handleServe = async (id: string) => {
    try {
      await updateOrder(id, { orderStatus: "SERVED" });
      await loadOrders();
      showToast("Order served successfully.", "success");
    } catch (error) {
      showToast("Failed to serve order.", "error");
      console.error("Serve order error:", error);
    }
  };

  const refundOrderStock = async (order: Order) => {
    if (!order.items) return;

    try {
      for (const item of order.items) {
        const quantity = item.quantity;

        // Refund stock for materials
        if (item.size?.materials) {
          for (const sizeMaterial of item.size.materials) {
            const materialId = sizeMaterial.materialId || sizeMaterial.material?.id;
            const quantityUsed = (sizeMaterial.quantityUsed || 0) * quantity;
            
            if (materialId && quantityUsed > 0) {
              const material = materials.find((m: any) => m.id === materialId);
              if (material?.stock?.id) {
                await currentDataService.updateStock(material.stock.id, 
                  (material.stock.quantity || 0) + quantityUsed);
              }
            }
          }
        }

        // Refund stock for ingredients (from size)
        if (item.size?.ingredients) {
          for (const sizeIngredient of item.size.ingredients) {
            const ingredientId = sizeIngredient.ingredientId || sizeIngredient.ingredient?.id;
            const quantityUsed = (sizeIngredient.quantityUsed || 0) * quantity;
            
            if (ingredientId && quantityUsed > 0) {
              const ingredient = ingredients.find((i: any) => i.id === ingredientId);
              if (ingredient?.stock?.id) {
                await currentDataService.updateStock(ingredient.stock.id,
                  (ingredient.stock.quantity || 0) + quantityUsed);
              }
            }
          }
        }

        // Refund stock for flavor ingredients
        if (item.flavor?.id) {
          try {
            const flavorIngredients = await getFlavorIngredients(item.flavor.id);
            for (const flavorIngredient of flavorIngredients) {
              const ingredientId = flavorIngredient.id;
              const quantityUsed = (flavorIngredient.quantity || 0) * quantity;
              
              if (ingredientId && quantityUsed > 0) {
                const ingredient = ingredients.find((i: any) => i.id === ingredientId);
                if (ingredient?.stock?.id) {
                  await currentDataService.updateStock(ingredient.stock.id,
                    (ingredient.stock.quantity || 0) + quantityUsed);
                }
              }
            }
          } catch (error) {
            console.error("Error refunding flavor ingredients:", error);
          }
        }

        // Refund stock for addons
        if (item.addons) {
          for (const addon of item.addons) {
            const addonId = addon.addon?.id;
            const addonQuantity = addon.quantity || 0;
            
            if (addonId && addonQuantity > 0) {
              const addonItem = addons.find((a: any) => a.id === addonId);
              if (addonItem?.stock?.id) {
                await currentDataService.updateStock(addonItem.stock.id,
                  (addonItem.stock.quantity || 0) + addonQuantity);
              }
            }
          }
        }
      }
      console.log("Stock refunded successfully for order:", order.id);
    } catch (error) {
      console.error("Error refunding stock for order:", error);
      throw error;
    }
  };

  const handleCancelOrder = async (order: Order, reason: string = "Order cancelled by customer") => {
    try {
      // Update order status to CANCELLED
      await updateOrder(order.id, { orderStatus: "CANCELLED" });
      
      // Refund stock
      await refundOrderStock(order);
      
      // Record cash expense for refund
      const refundAmount = order.total || 0;
      if (refundAmount > 0) {
        await currentDataService.recordExpense(
          refundAmount,
          `Order #${order.id.slice(-6)} cancellation refund - ${reason}`
        );
      }

      await loadOrders();
      await loadCashDrawerBalance();
      showToast("Order cancelled and refunded successfully.", "success");
    } catch (error) {
      showToast("Failed to cancel order.", "error");
      console.error("Cancel order error:", error);
    }
  };

  const handleWrongOrder = async (order: Order, reason: string = "Wrong order marked by staff") => {
    try {
      console.log("🔄 Starting wrong order process for:", order.id);
      
      // Update order status to WRONG
      console.log("📝 Updating order status to WRONG...");
      await updateOrder(order.id, { orderStatus: "WRONG" });
      console.log("✅ Order status updated successfully");
      
      // Refund payment but NOT stock (ingredients/materials already used)
      const refundAmount = order.total || 0;
      console.log("💰 Refund amount:", refundAmount);
      
      if (refundAmount > 0) {
        console.log("💸 Recording expense for refund...");
        await currentDataService.recordExpense(
          refundAmount,
          `Order #${order.id.slice(-6)} wrong order refund - ${reason}`
        );
        console.log("✅ Expense recorded successfully");
      }

      console.log("🔄 Refreshing orders and cash balance...");
      await loadOrders();
      await loadCashDrawerBalance();
      
      console.log("✅ Wrong order process completed successfully");
      showToast("Order marked as wrong and payment refunded.", "success");
    } catch (error) {
      console.error("❌ Wrong order error details:", {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        orderId: order.id,
        orderTotal: order.total
      });
      showToast("Failed to mark order as wrong. Check console for details.", "error");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === "All" || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleCancelOrderType = () => {
    // Clear current order items if any
    setOrderItems([]);
    setPayment("");
    setSelectedProduct(null);
    setSelectedFlavor(null);
    setSelectedSize(null);
    setSelectedAddons([]);
    setEditingOrderId(null);
    setIsOrderPanelVisible(false);
    setShowDialog(false);

    // Reset order type to show selection screen
    setOrderType("");
  };

  // Shared header component
  const renderHeader = () => (
    <header className="bg-white/80 backdrop-blur-lg border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/papabear.jpg" alt="Bear Icon" className="w-10 h-10" />

            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                Papa Bear Café
              </h1>
              <p className="text-sm text-neutral-600">Point of Sale System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsQueueVisible(!isQueueVisible)}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span className="text-lg">📝</span>
              <span className="text-sm font-semibold text-blue-700">
                Queue ({orders.length})
              </span>
            </button>
            {orderType && (
              <button
                onClick={() => setIsStocksVisible(!isStocksVisible)}
                className="bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Package className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">
                  Stocks
                </span>
              </button>
            )}
            <div className="bg-green-50 border border-green-200 px-3 py-1 rounded-lg flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                ₱{cashDrawerBalance.toFixed(2)}
              </span>
            </div>
            {orderType ? (
              // Show order type and cancel button only when in POS mode
              <div className="flex items-center space-x-2">
                <div className="badge badge-primary">
                  {formatOrderType(orderType as OrderType)}
                </div>
                <button
                  onClick={handleCancelOrderType}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors group"
                  title="Cancel and go back to order type selection"
                >
                  <ArrowLeft
                    size={14}
                    className="text-red-600 group-hover:text-red-700"
                  />
                  <span className="text-xs font-semibold text-red-600 group-hover:text-red-700">
                    Cancel
                  </span>
                </button>
              </div>
            ) : (
              // Show date on loading screen
              <div className="badge badge-neutral">
                {formatDate(new Date())}
              </div>
            )}
            {orderType && (
              // Show cart button only when in POS mode
              <button
                onClick={() => setIsOrderPanelVisible(true)}
                className="btn btn-primary btn-md lg:hidden relative"
              >
                <ShoppingCart size={18} />
                Cart ({orderItems.length})
                {orderItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {orderItems.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // Landing screen (choose order type)
  if (!orderType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        {renderHeader()}

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome */}
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <img
                src="/papabear.jpg"
                alt="Bear Icon"
                className="w-20 h-20 mx-auto"
              />

              <div>
                <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent leading-tight">
                  Welcome to
                  <br />
                  Papa Bear Café
                </h1>
                <p className="text-xl lg:text-2xl text-neutral-600 font-medium mt-4">
                  Choose your order type to get started
                </p>
              </div>
            </div>

            {/* Order type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <button
                onClick={() => setOrderType("DINE_IN")}
                className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-2 border-transparent hover:border-green-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Utensils size={32} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl lg:text-3xl font-bold text-neutral-800 mb-2">
                      Dine In
                    </h3>
                    <p className="text-neutral-600">
                      Enjoy your meal here in our cozy café
                    </p>
                  </div>
                  <div className="w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </button>

              <button
                onClick={() => setOrderType("TAKE_OUT")}
                className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-2 border-transparent hover:border-green-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Coffee size={32} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl lg:text-3xl font-bold text-neutral-800 mb-2">
                      Take Out
                    </h3>
                    <p className="text-neutral-600">
                      Quick orders to go wherever you are
                    </p>
                  </div>
                  <div className="w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Queue overlay */}
        <div
          className={`fixed inset-0 z-50 transform transition-transform duration-300 ${
            isQueueVisible ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div
            className="bg-black/50 backdrop-blur-sm absolute inset-0 z-0"
            onClick={() => setIsQueueVisible(false)}
          />
          <div className="bg-white h-full w-full max-w-6xl ml-auto flex flex-col relative shadow-2xl">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                    📝 Order Management
                  </h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    {allOrders.length} total orders • {orders.length} showing
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-medium text-neutral-600">
                      Live Updates
                    </span>
                  </div>
                  <button
                    onClick={() => setIsQueueVisible(false)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-neutral-500" />
                  </button>
                </div>
              </div>
              
              {/* Order Status Filter */}
              <div className="flex flex-wrap gap-2">
                {["QUEUING", "SERVED", "CANCELLED", "WRONG"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status as typeof orderStatusFilter)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      orderStatusFilter === status
                        ? status === "CANCELLED" || status === "WRONG"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : status === "SERVED"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    } border`}
                  >
                    {status === "QUEUING"
                      ? `Queuing (${allOrders.filter(o => o.orderStatus === "QUEUING").length})`
                      : status === "SERVED" 
                      ? `Served (${allOrders.filter(o => o.orderStatus === "SERVED").length})`
                      : status === "CANCELLED"
                      ? `Cancelled (${allOrders.filter(o => o.orderStatus === "CANCELLED").length})`
                      : `Wrong (${allOrders.filter(o => o.orderStatus === "WRONG").length})`
                    }
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {orders.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="card card-hover bg-white border-2 border-transparent hover:border-green-200 transition-all duration-300"
                    >
                      <div className={`p-4 border-b border-neutral-200 bg-gradient-to-r ${
                        order.orderStatus === "QUEUING" 
                          ? "from-blue-50 to-blue-50"
                          : order.orderStatus === "SERVED"
                          ? "from-green-50 to-emerald-50"
                          : order.orderStatus === "CANCELLED"
                          ? "from-red-50 to-red-50"
                          : order.orderStatus === "WRONG"
                          ? "from-orange-50 to-orange-50"
                          : "from-gray-50 to-gray-50"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-lg text-neutral-900">
                              #{order.id.slice(0, 6)}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="badge badge-primary text-xs">
                                {formatOrderType(order.orderType)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                order.orderStatus === "QUEUING" 
                                  ? "bg-blue-100 text-blue-700"
                                  : order.orderStatus === "SERVED"
                                  ? "bg-green-100 text-green-700"
                                  : order.orderStatus === "CANCELLED"
                                  ? "bg-red-100 text-red-700"
                                  : order.orderStatus === "WRONG"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {order.orderStatus}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {new Date(
                                  order.createdAt || Date.now()
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            order.orderStatus === "QUEUING" 
                              ? "bg-blue-100"
                              : order.orderStatus === "SERVED"
                              ? "bg-green-100"
                              : order.orderStatus === "CANCELLED"
                              ? "bg-red-100"
                              : order.orderStatus === "WRONG"
                              ? "bg-orange-100"
                              : "bg-gray-100"
                          }`}>
                            <span className="text-lg">
                              {order.orderStatus === "QUEUING" 
                                ? "⏳"
                                : order.orderStatus === "SERVED"
                                ? "🍽️"
                                : order.orderStatus === "CANCELLED"
                                ? "❌"
                                : order.orderStatus === "WRONG"
                                ? "⚠️"
                                : "❓"
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                        {order.items?.map((item, index) => (
                          <div
                            key={index}
                            className="bg-neutral-50 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-neutral-900">
                                  {item.product?.name || "Unknown Product"}
                                </h4>
                                <div className="flex gap-1 mt-1">
                                  <span className="badge badge-neutral text-xs">
                                    {item.flavor?.name || "Unknown Flavor"}
                                  </span>
                                  <span className="badge badge-success text-xs">
                                    {item.size?.name || "Unknown Size"}
                                  </span>
                                </div>
                                {item.addons?.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {item.addons.map((a, addonIndex) => (
                                      <span
                                        key={a.addon?.id || addonIndex}
                                        className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full"
                                      >
                                        +{a.addon?.name || "Unknown Addon"} x
                                        {a.quantity}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-sm text-neutral-900">
                                  x{item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        )) || []}
                      </div>

                      <div className="p-4 border-t border-neutral-200 bg-neutral-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-neutral-600">
                            Total Amount
                          </span>
                          <span className="font-bold text-lg text-green-600">
                            ₱{order.total?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        
                        {order.orderStatus === "QUEUING" && (
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <LongPressServeButton
                                onConfirm={() => handleServe(order.id)}
                                idleLabel="Serve Order"
                                confirmingLabel="Hold to Confirm"
                                successLabel="Served!"
                                holdMs={1000}
                              />
                            </div>
                            <button
                              onClick={() => setShowCancelConfirm(order.id)}
                              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <XCircle size={12} />
                              Cancel
                            </button>
                          </div>
                        )}
                        
                        {order.orderStatus === "SERVED" && (
                          <div className="space-y-2">
                            <div className="text-center text-green-600 font-medium py-2">
                              ✅ Order Completed
                            </div>
                            <button
                              onClick={() => setShowWrongConfirm(order.id)}
                              className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <AlertTriangle size={14} />
                              Mark as Wrong Order
                            </button>
                          </div>
                        )}
                        
                        {order.orderStatus === "CANCELLED" && (
                          <div className="text-center text-red-600 font-medium py-2">
                            ❌ Order Cancelled & Refunded
                          </div>
                        )}
                        
                        {order.orderStatus === "WRONG" && (
                          <div className="text-center text-orange-600 font-medium py-2">
                            ⚠️ Wrong Order - Payment Refunded
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🍽️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-700 mb-2">
                    No orders in queue
                  </h3>
                  <p className="text-neutral-500 max-w-sm mx-auto">
                    New orders will appear here automatically when customers
                    place them.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main POS screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {renderHeader()}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controls */}
            <div className="card p-6 flex flex-col">
              <div className="flex flex-col gap-4 items-start lg:items-center justify-between">
                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat as Category)}
                      className={`btn ${
                        selectedCategory === cat
                          ? "btn-primary"
                          : "btn-secondary"
                      } btn-sm flex items-center gap-2`}
                    >
                      {categoryIcons[cat]}
                      <span className="hidden sm:inline">
                        {cat === "All"
                          ? "All Products"
                          : cat === "ColdBeverages"
                          ? "Cold Beverages"
                          : cat === "HotBeverages"
                          ? "Hot Beverages"
                          : cat}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="w-full relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-3 text-neutral-400"
                  />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div key={product.id} className="relative group">
                    <button
                      onClick={() => handleProductClick(product)}
                      className={`card card-hover w-full p-4 text-left transition-all duration-300 ${
                        selectedProduct?.id === product.id
                          ? "ring-2 ring-green-500 bg-green-50 shadow-lg scale-105"
                          : ""
                      }`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-neutral-100 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-neutral-400 space-y-2">
                            <Package size={32} />
                            <span className="text-xs font-medium">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-neutral-900 text-sm leading-tight">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="badge badge-neutral text-xs">
                            {product.sizes?.length || 0} sizes
                          </span>
                          <span
                            className={`text-xs ${
                              product.flavors?.length > 0
                                ? "text-green-600 font-medium"
                                : "text-neutral-500"
                            }`}
                          >
                            {product.flavors?.length || 0} flavors
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Product Modal */}
                    {selectedProduct?.id === product.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                          {/* Header */}
                          <div className="p-6 border-b border-neutral-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                                    <Package
                                      size={20}
                                      className="text-neutral-400"
                                    />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-bold text-lg text-neutral-900">
                                    {product.name}
                                  </h3>
                                  <p className="text-sm text-neutral-600">
                                    Customize your order
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={cancelSelection}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                              >
                                <X size={20} className="text-neutral-500" />
                              </button>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                            {/* Flavor Selection - Always show if flavors exist */}
                            {product.flavors && product.flavors.length > 0 && (
                              <div>
                                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                                  Choose Flavor
                                  {product.flavors.length === 1 && (
                                    <span className="text-xs text-neutral-500 ml-2">
                                      (1 option available)
                                    </span>
                                  )}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  {product.flavors.map((flavor) => (
                                    <button
                                      key={flavor.id}
                                      onClick={() => handleFlavorSelect(flavor)}
                                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                        selectedFlavor?.id === flavor.id
                                          ? "border-green-500 bg-green-50 text-green-700"
                                          : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                                      }`}
                                    >
                                      {flavor.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Show message if no flavors available */}
                            {(!product.flavors ||
                              product.flavors.length === 0) &&
                              selectedFlavor && (
                                <div>
                                  <label className="block text-sm font-semibold text-neutral-900 mb-3">
                                    Flavor
                                  </label>
                                  <div className="p-3 rounded-lg bg-neutral-100 border-2 border-neutral-300">
                                    <span className="text-sm text-neutral-600">
                                      Default (no flavor options available)
                                    </span>
                                  </div>
                                </div>
                              )}

                            {/* Size */}
                            {selectedFlavor && (
                              <div ref={sizeSelectionRef}>
                                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                                  Choose Size
                                </label>
                                {product.sizes && product.sizes.length > 0 ? (
                                  <div className="space-y-2">
                                    {product.sizes.map((size) => (
                                      <button
                                        key={size.id}
                                        onClick={() => handleSizeSelect(size)}
                                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                                          selectedSize?.id === size.id
                                            ? "border-green-500 bg-green-50"
                                            : "border-neutral-200 hover:border-neutral-300"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="font-semibold text-neutral-900">
                                              {size.name}
                                            </div>
                                          </div>
                                          <div className="text-lg font-bold text-green-600">
                                            ₱{size.price.toFixed(2)}
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                                    No sizes available for this product
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Addons */}
                            {selectedSize && (
                              <div>
                                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                                  Add-ons (Optional)
                                </label>
                                {addons && addons.length > 0 ? (
                                  <div className="space-y-2">
                                    {addons.map((addon) => {
                                      const selectedAddon = selectedAddons.find(
                                        (a) => a.addon.id === addon.id
                                      );
                                      const quantity =
                                        selectedAddon?.quantity || 0;

                                      return (
                                        <div
                                          key={addon.id}
                                          className="flex items-center justify-between p-4 rounded-lg border-2 border-neutral-200 hover:border-neutral-300 transition-all"
                                        >
                                          <div className="flex-1">
                                            <div className="font-semibold text-neutral-900">
                                              {addon.name}
                                            </div>
                                            <div className="text-sm text-green-600 font-medium">
                                              +₱{addon.price.toFixed(2)}
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() =>
                                                handleAddonChange(addon, -1)
                                              }
                                              disabled={quantity === 0}
                                              className="w-8 h-8 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:border-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                              <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center font-semibold text-neutral-900">
                                              {quantity}
                                            </span>
                                            <button
                                              onClick={() =>
                                                handleAddonChange(addon, 1)
                                              }
                                              className="w-8 h-8 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:border-green-400 hover:bg-green-50 transition-colors"
                                            >
                                              <Plus size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-neutral-500 text-sm bg-neutral-50 p-3 rounded-lg">
                                    No add-ons available
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          {selectedSize && (
                            <div className="p-6 border-t border-neutral-200 bg-neutral-50">
                              <button
                                onClick={addToCart}
                                className="btn btn-primary btn-lg w-full"
                              >
                                Add to Cart
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <div className="card p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                      No products found
                    </h3>
                    <p className="text-neutral-500">
                      Try adjusting your search or category filter
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Cart */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="card sticky top-24 rounded-b-xl">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-bold text-neutral-900">
                  Current Order
                </h2>
                {orderItems.length > 0 && (
                  <div className="mt-2 text-sm text-neutral-600">
                    {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              <div className="flex-1 max-h-96 overflow-y-auto">
                {orderItems.length > 0 ? (
                  <div className="p-6 space-y-4">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-neutral-50 rounded-xl p-4 border border-neutral-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-neutral-900 text-sm">
                              {item.product?.name || "Unknown Product"}
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <span className="badge badge-primary">
                                {item.flavor?.name || "Unknown Flavor"}
                              </span>
                              <span className="badge badge-success">
                                {item.size?.name || "Unknown Size"}
                              </span>
                            </div>
                            {item.addons?.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {item.addons.map((addon, addonIndex) => (
                                  <span
                                    key={addon.addon?.id || addonIndex}
                                    className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full"
                                  >
                                    +{addon.addon?.name || "Unknown Addon"} x
                                    {addon.quantity}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 font-semibold text-green-600">
                              ₱
                              {(() => {
                                const basePrice = item.size?.price || 0;
                                const addonPrice = (item.addons || []).reduce(
                                  (sum, addon) =>
                                    sum +
                                    (addon.addon?.price || 0) *
                                      (addon.quantity || 0),
                                  0
                                );
                                return (basePrice + addonPrice).toFixed(2);
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => editItem(index)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                            >
                              <Edit
                                size={16}
                                className="text-neutral-400 group-hover:text-blue-500"
                              />
                            </button>
                            <button
                              onClick={() => removeItem(index)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            >
                              <Trash
                                size={16}
                                className="text-neutral-400 group-hover:text-red-500"
                              />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-white rounded-lg border border-neutral-300">
                            <button
                              className="p-2 hover:bg-neutral-50 transition-colors"
                              onClick={() => updateItemQuantity(index, -1)}
                            >
                              <Minus size={16} className="text-neutral-600" />
                            </button>
                            <span className="px-4 py-2 font-semibold text-neutral-900 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              className="p-2 hover:bg-neutral-50 transition-colors"
                              onClick={() => updateItemQuantity(index, 1)}
                            >
                              <Plus size={16} className="text-neutral-600" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-neutral-900">
                              ₱
                              {(() => {
                                const basePrice = item.size?.price || 0;
                                const addonPrice = (item.addons || []).reduce(
                                  (sum, addon) =>
                                    sum +
                                    (addon.addon?.price || 0) *
                                      (addon.quantity || 0),
                                  0
                                );
                                return (
                                  (basePrice + addonPrice) *
                                  item.quantity
                                ).toFixed(2);
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🛒</span>
                    </div>
                    <h3 className="font-semibold text-neutral-700 mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Add items to get started
                    </p>
                  </div>
                )}
              </div>

              {orderItems.length > 0 && (
                <div className="border-t border-neutral-200 bg-neutral-50 p-6 rounded-b-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-neutral-900">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      ₱{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDialog(true)}
                    disabled={orderItems.length === 0}
                    className="btn btn-primary btn-lg w-full"
                  >
                    Proceed to Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart Overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transform transition-transform duration-300 ${
          isOrderPanelVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="bg-black/50 backdrop-blur-sm absolute inset-0 z-0"
          onClick={() => setIsOrderPanelVisible(false)}
        />
        <div className="bg-white h-full w-full max-w-md ml-auto flex flex-col relative">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">
              Current Order
            </h2>
            <button
              onClick={() => setIsOrderPanelVisible(false)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-neutral-500" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {orderItems.length > 0 ? (
                <div className="p-6 space-y-4">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-neutral-50 rounded-xl p-4 border border-neutral-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 text-sm">
                            {item.product?.name || "Unknown Product"}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="badge badge-primary">
                              {item.flavor?.name || "Unknown Flavor"}
                            </span>
                            <span className="badge badge-success">
                              {item.size?.name || "Unknown Size"}
                            </span>
                          </div>
                          {item.addons?.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {item.addons.map((addon, addonIndex) => (
                                <span
                                  key={addon.addon?.id || addonIndex}
                                  className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full"
                                >
                                  +{addon.addon?.name || "Unknown Addon"} x
                                  {addon.quantity}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center bg-white rounded-lg border border-neutral-300">
                              <button
                                className="p-2 hover:bg-neutral-50 transition-colors"
                                onClick={() => updateItemQuantity(index, -1)}
                              >
                                <Minus size={16} className="text-neutral-600" />
                              </button>
                              <span className="px-3 py-2 font-semibold text-neutral-900 min-w-[2.5rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                className="p-2 hover:bg-neutral-50 transition-colors"
                                onClick={() => updateItemQuantity(index, 1)}
                              >
                                <Plus size={16} className="text-neutral-600" />
                              </button>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                ₱
                                {(
                                  (item.size?.price || 0) * item.quantity
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group ml-2"
                        >
                          <Trash
                            size={16}
                            className="text-neutral-400 group-hover:text-red-500"
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <h3 className="font-semibold text-neutral-700 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Add items to get started
                  </p>
                </div>
              )}
            </div>

            {orderItems.length > 0 && (
              <div className="border-t border-neutral-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-neutral-900">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    ₱{calculateTotal().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowDialog(true);
                    setIsOrderPanelVisible(false);
                  }}
                  disabled={orderItems.length === 0}
                  className="btn btn-primary btn-lg w-full"
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white relative h-full rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-6 border-b border-neutral-200 ">
              <h2 className="text-xl font-bold text-neutral-900">
                Complete Payment
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Review your order and enter payment amount
              </p>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-neutral-600">
                    Order Total
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 mt-1">
                    ₱{calculateTotal().toFixed(2)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600">
                    Payment Amount
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    ₱{payment || "0.00"}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600">
                    Change
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    ₱
                    {Math.max(
                      0,
                      parseFloat(payment || "0") - calculateTotal()
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={clearPayment}
                    disabled={orderItems.length === 0}
                    className="btn btn-error btn-md flex-1"
                  >
                    Clear
                  </button>
                  <button
                    onClick={deleteDigit}
                    data-key="Backspace"
                    disabled={orderItems.length === 0}
                    className="btn btn-secondary btn-md flex-1"
                  >
                    ← Delete
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                    <button
                      key={n}
                      data-key={n}
                      onClick={() => handleDigit(n)}
                      disabled={orderItems.length === 0}
                      className="btn btn-secondary btn-lg h-16 text-2xl font-bold"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    data-key="0"
                    onClick={() => handleDigit("0")}
                    disabled={orderItems.length === 0}
                    className="btn btn-secondary btn-lg h-16 text-2xl font-bold col-span-2"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleDigit(".")}
                    data-key="."
                    disabled={orderItems.length === 0}
                    className="btn btn-secondary btn-lg h-16 text-2xl font-bold"
                  >
                    .
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t absolute bottom-0 w-full border-neutral-200 bg-neutral-50 p-6 flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="btn btn-secondary btn-lg flex-1"
              >
                Cancel
              </button>
              <button
                data-key="Enter"
                onClick={handleConfirmOrder}
                disabled={!isPaymentSufficient || orderItems.length === 0}
                className="btn btn-success btn-lg flex-2"
              >
                {isPaymentSufficient
                  ? "Complete Order"
                  : "Insufficient Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy dialog kept closed for compatibility */}
      <OrderConfirmationDialog
        isOpen={false}
        onClose={() => setShowDialog(false)}
        title="Review Order"
      >
        <div>Order details would go here</div>
      </OrderConfirmationDialog>

      {/* This queue overlay is handled by the main one above */}

      {/* Stocks Modal */}
      <div
        className={`fixed inset-0 z-[9999] transform transition-transform duration-300 ${
          isStocksVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="bg-black/50 backdrop-blur-sm absolute inset-0 z-0"
          onClick={() => setIsStocksVisible(false)}
        />
        <div className="bg-white h-full w-full max-w-6xl ml-auto flex flex-col relative shadow-2xl">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-3">
                📦 Stock Management
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Monitor inventory levels and stock status
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
                <span className="text-sm font-medium text-neutral-600">
                  Live Inventory
                </span>
              </div>
              <button
                onClick={() => setIsStocksVisible(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
          </div>

          {/* Stock Filters */}
          <div className="p-6 border-b border-neutral-200 bg-neutral-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Filter Dropdown */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Filter by Status
                </label>
                <CustomSelect
                  value={stockFilter}
                  options={[
                    { label: "All Status", value: "all" },
                    { label: "Good Stock", value: "good" },
                    { label: "Low Stock", value: "low" },
                    { label: "Out of Stock", value: "out" },
                  ]}
                  onChange={(value) =>
                    setStockFilter(value as "all" | "good" | "low" | "out")
                  }
                  className="w-full"
                />
              </div>

              {/* Type Filter Dropdown */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Filter by Type
                </label>
                <CustomSelect
                  value={typeFilter}
                  options={[
                    {
                      label: `All Types (${getAllStockItems().length})`,
                      value: "all",
                    },
                    {
                      label: `📦 Materials (${
                        getAllStockItems().filter(
                          (item) => item.type === "Material"
                        ).length
                      })`,
                      value: "Material",
                    },
                    {
                      label: `🥛 Ingredients (${
                        getAllStockItems().filter(
                          (item) => item.type === "Ingredient"
                        ).length
                      })`,
                      value: "Ingredient",
                    },
                    {
                      label: `➕ Add-ons (${
                        getAllStockItems().filter(
                          (item) => item.type === "Add-on"
                        ).length
                      })`,
                      value: "Add-on",
                    },
                  ]}
                  onChange={(value) =>
                    setTypeFilter(
                      value as "all" | "Material" | "Ingredient" | "Add-on"
                    )
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Stock Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {(() => {
              // Get all stock items
              const baseStockItems = getAllStockItems();

              const filteredStockItems = baseStockItems.filter(
                (item) =>
                  (stockFilter === "all" || item.status === stockFilter) &&
                  (typeFilter === "all" || item.type === typeFilter)
              );

              return filteredStockItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStockItems.map((item) => (
                    <div
                      key={item.id}
                      className={`card bg-white border-2 transition-all duration-300 ${
                        item.status === "out"
                          ? "border-red-200 hover:border-red-300"
                          : item.status === "low"
                          ? "border-yellow-200 hover:border-yellow-300"
                          : "border-green-200 hover:border-green-300"
                      }`}
                    >
                      <div
                        className={`p-4 border-b border-neutral-200 ${
                          item.status === "out"
                            ? "bg-gradient-to-r from-red-50 to-red-50"
                            : item.status === "low"
                            ? "bg-gradient-to-r from-yellow-50 to-yellow-50"
                            : "bg-gradient-to-r from-green-50 to-green-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-neutral-900">
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="badge badge-neutral text-xs">
                                {item.type}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  item.status === "out"
                                    ? "bg-red-100 text-red-700"
                                    : item.status === "low"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {item.statusLabel}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              item.status === "out"
                                ? "bg-red-100"
                                : item.status === "low"
                                ? "bg-yellow-100"
                                : "bg-green-100"
                            }`}
                          >
                            <Package
                              className={`w-6 h-6 ${
                                item.status === "out"
                                  ? "text-red-600"
                                  : item.status === "low"
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="text-center space-y-3">
                          <div>
                            <span className="text-sm font-medium text-neutral-600">
                              Current Stock
                            </span>
                            <div className="text-3xl font-bold text-neutral-900 mt-1">
                              {item.currentStock}{" "}
                              <span className="text-lg text-neutral-600">
                                {item.unit}
                              </span>
                            </div>
                          </div>

                          {item.quantityUsed && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                              <span className="text-xs font-medium text-amber-700">
                                Used per serving: {item.quantityUsed}{" "}
                                {item.unit}
                              </span>
                            </div>
                          )}
                        </div>

                        {item.status === "out" && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="text-sm font-medium text-red-700">
                                Action Required: Restock immediately
                              </span>
                            </div>
                          </div>
                        )}

                        {item.status === "low" && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              <span className="text-sm font-medium text-yellow-700">
                                Warning: Stock running low
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
                    <Package size={48} className="text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-700 mb-2">
                    {stockFilter === "all"
                      ? "No stock items found"
                      : `No ${stockFilter} stock items`}
                  </h3>
                  <p className="text-neutral-500 max-w-sm mx-auto">
                    {stockFilter === "all"
                      ? "No inventory items are currently available in the system."
                      : `There are no items with ${stockFilter} stock status.`}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Popup */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Cancel Order
              </h3>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to cancel order #{showCancelConfirm.slice(0, 6)}? 
                This will refund the payment and restore all used stock items.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => {
                    const order = allOrders.find(o => o.id === showCancelConfirm);
                    if (order) handleCancelOrder(order);
                    setShowCancelConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Wrong Order Confirmation Popup */}
      {showWrongConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Mark as Wrong Order
              </h3>
              <p className="text-neutral-600 mb-6">
                Are you sure this order #{showWrongConfirm.slice(0, 6)} was prepared incorrectly? 
                This will refund the payment but NOT restore stock items.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWrongConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => {
                    const order = allOrders.find(o => o.id === showWrongConfirm);
                    if (order) handleWrongOrder(order);
                    setShowWrongConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Mark Wrong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
