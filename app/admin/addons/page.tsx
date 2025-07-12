"use client";

import { useEffect, useState } from "react";
import { AddonInput, AddonWithStock } from "@/lib/types";
import { Pencil, Trash } from "lucide-react";

export default function AddonsAdminPage() {
  const [addons, setAddons] = useState<AddonWithStock[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AddonInput>>({});

  const loadAddons = async () => {
    const res = await fetch("/api/addons");
    setAddons(await res.json());
  };

  useEffect(() => {
    loadAddons();
  }, []);

  const createAddon = async () => {
    const payload: AddonInput = { name, price, stockQuantity };
    await fetch("/api/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setName("");
    setPrice(0);
    setStockQuantity(0);
    loadAddons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this addon?")) return;
    await fetch(`/api/addons/${id}`, { method: "DELETE" });
    loadAddons();
  };

  const handleEditChange = (
    field: keyof AddonInput,
    value: string | number
  ) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch(`/api/addons/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    setEditForm({});
    loadAddons();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Addons</h1>

      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Addon Name</label>
          <input
            className="border p-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Price</label>
          <input
            type="number"
            className="border p-2 w-full"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Stock Quantity</label>
          <input
            type="number"
            className="border p-2 w-full"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(parseInt(e.target.value))}
          />
        </div>

        <button
          onClick={createAddon}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Addon
        </button>
      </div>

      <table className="w-full mt-6 border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Price</th>
            <th className="p-2 text-left">Stock</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {addons.map((addon) => (
            <tr key={addon.id} className="border-t">
              {editingId === addon.id ? (
                <>
                  <td className="p-2">
                    <input
                      value={editForm.name ?? addon.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="border p-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={editForm.price ?? addon.price}
                      onChange={(e) =>
                        handleEditChange("price", parseFloat(e.target.value))
                      }
                      className="border p-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={
                        editForm.stockQuantity ?? addon.stock?.quantity ?? 0
                      }
                      onChange={(e) =>
                        handleEditChange(
                          "stockQuantity",
                          parseInt(e.target.value)
                        )
                      }
                      className="border p-1 w-full"
                    />
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={saveEdit}
                      className="text-green-600 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2">{addon.name}</td>
                  <td className="p-2">₱{addon.price.toFixed(2)}</td>
                  <td className="p-2">{addon.stock?.quantity ?? 0}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(addon.id);
                        setEditForm({
                          name: addon.name,
                          price: addon.price,
                          stockQuantity: addon.stock?.quantity ?? 0,
                        });
                      }}
                    >
                      <Pencil size={16} className="text-blue-600" />
                    </button>
                    <button onClick={() => handleDelete(addon.id)}>
                      <Trash size={16} className="text-red-600" />
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
