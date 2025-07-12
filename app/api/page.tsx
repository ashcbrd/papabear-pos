"use client";

import { useEffect, useState } from "react";
import { ProductWithVariants, AddonWithStock } from "@/lib/types";

type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  addons: { id: string; quantity: number }[];
};

export default function POSPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [addons, setAddons] = useState<AddonWithStock[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [payment, setPayment] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const prods = await fetch("/api/products").then((r) => r.json());
      const adds = await fetch("/api/addons").then((r) => r.json());
      setProducts(prods);
      setAddons(adds);
    })();
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  function addToCart(product: ProductWithVariants) {
    setCartItems([
      ...cartItems,
      {
        productId: product.id,
        variantId: product.variants[0].id,
        quantity: 1,
        addons: [],
      },
    ]);
  }

  function updateCartItem(idx: number, update: Partial<CartItem>) {
    setCartItems((c) => {
      const cp = [...c];
      cp[idx] = { ...cp[idx], ...update };
      return cp;
    });
  }

  function total() {
    return cartItems.reduce((sum, i) => {
      const prod = products.find((p) => p.id === i.productId)!;
      const variant = prod.variants.find((v) => v.id === i.variantId)!;
      const itemTotal =
        variant.price * i.quantity +
        i.addons.reduce((aSum, a) => {
          const addon = addons.find((ad) => ad.id === a.id)!;
          return aSum + addon.price * a.quantity;
        }, 0);
      return sum + itemTotal;
    }, 0);
  }

  async function confirmOrder() {
    const totalPrice = total();
    const change = payment - totalPrice;
    if (change < 0) {
      alert("Paid amount is insufficient");
      return;
    }
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartItems,
        total: totalPrice,
        paid: payment,
        change,
      }),
    });
    alert("Order placed! Change: " + change);
    setCartItems([]);
    setPayment(0);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">⚡ POS</h1>

      {/* Category selector */}
      <div className="flex gap-4 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            } px-4 py-2 rounded`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products
          .filter((p) => p.category === selectedCategory)
          .map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="border p-4 rounded cursor-pointer hover:bg-gray-100"
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  className="h-24 w-full object-cover rounded mb-2"
                />
              )}
              <div className="font-medium">{p.name}</div>
              <small className="text-gray-600">
                {p.variants.map((v) => v.name).join(", ")}
              </small>
            </div>
          ))}
      </div>

      {/* Cart */}
      <div className="border p-4 rounded space-y-4">
        <h2 className="text-xl font-semibold">Current Order</h2>
        {cartItems.map((item, i) => {
          const prod = products.find((p) => p.id === item.productId)!;
          return (
            <div key={i} className="border-b pb-2 space-y-2">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{prod.name}</div>
                  <select
                    value={item.variantId}
                    onChange={(e) =>
                      updateCartItem(i, { variantId: e.target.value })
                    }
                    className="border rounded"
                  >
                    {prod.variants.map((v) => (
                      <option value={v.id} key={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateCartItem(i, {
                        quantity: Math.max(1, item.quantity - 1),
                      })
                    }
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateCartItem(i, { quantity: item.quantity + 1 })
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Addons */}
              <div className="space-y-1">
                {addons.map((ad) => {
                  const entry = item.addons.find((a) => a.id === ad.id);
                  return (
                    <div
                      key={ad.id}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {ad.name} (+₱{ad.price})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newAddons = item.addons.filter(
                              (a) => a.id !== ad.id
                            );
                            if (entry && entry.quantity > 1) {
                              newAddons.push({
                                id: ad.id,
                                quantity: entry.quantity - 1,
                              });
                            }
                            updateCartItem(i, { addons: newAddons });
                          }}
                        >
                          -
                        </button>
                        <span>{entry?.quantity || 0}</span>
                        <button
                          onClick={() => {
                            const newAddons = [
                              ...item.addons.filter((a) => a.id !== ad.id),
                            ];
                            newAddons.push({
                              id: ad.id,
                              quantity: (entry?.quantity || 0) + 1,
                            });
                            updateCartItem(i, { addons: newAddons });
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-4 flex justify-between">
          <div className="text-xl font-semibold">
            Total: ₱{total().toFixed(2)}
          </div>
          <div className="space-x-2">
            <button
              onClick={confirmOrder}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="border p-4 rounded flex items-center gap-4">
        <span>Paid Amount:</span>
        <input
          type="number"
          className="border p-2 w-32"
          onChange={(e) => setPayment(parseFloat(e.target.value))}
          value={payment}
        />
        <span>Change: ₱{(payment - total()).toFixed(2)}</span>
      </div>
    </div>
  );
}
