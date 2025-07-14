"use client";

import { useEffect, useState } from "react";
import { AddonInput, AddonWithStock } from "@/lib/types";
import { Pencil, Trash, UtensilsCrossed } from "lucide-react";

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
      <div className="flex items-center gap-2">
        <UtensilsCrossed size={24} className="text-green-700" />
        <h1 className="text-xl font-bold">Add-ons</h1>
      </div>

      <div className="space-y-2 border border-zinc-300 rounded-md p-4 bg-white">
        <label className="block text-sm">Addon Name</label>
        <input
          className="border border-zinc-300 rounded-md p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="block text-sm">Price</label>
        <input
          type="number"
          className="border border-zinc-300 rounded-md p-2 w-full"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
        />

        <label className="block text-sm">Stock Quantity</label>
        <input
          type="number"
          className="border border-zinc-300 rounded-md p-2 w-full"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(parseInt(e.target.value))}
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              setName("");
              setPrice(0);
              setStockQuantity(0);
            }}
            className="bg-zinc-200 text-zinc-700 px-4 py-2 rounded-md hover:bg-zinc-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={createAddon}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Addon
          </button>
        </div>
      </div>

      <table className="w-full mt-6 border border-zinc-300 text-sm bg-white rounded-md overflow-hidden">
        <thead>
          <tr className="text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Price</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {addons.map((addon) => (
            <tr key={addon.id} className="border-t border-zinc-200 align-top">
              {editingId === addon.id ? (
                <>
                  <td className="p-2">
                    <input
                      value={editForm.name ?? addon.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="border border-zinc-300 p-1 w-full rounded-md"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={editForm.price ?? addon.price}
                      onChange={(e) =>
                        handleEditChange("price", parseFloat(e.target.value))
                      }
                      className="border border-zinc-300 p-1 w-full rounded-md"
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
                      className="border border-zinc-300 p-1 w-full rounded-md"
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
