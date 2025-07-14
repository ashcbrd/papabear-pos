"use client";

import { useEffect, useState } from "react";
import { IngredientInput, IngredientWithStock } from "@/lib/types";
import { Pencil, Soup, Trash } from "lucide-react";

const measurementUnits = [
  "kg",
  "g",
  "oz",
  "ml",
  "l",
  "piece",
  "slice",
  "tbsp",
  "tsp",
];

export default function IngredientsAdminPage() {
  const [ingredients, setIngredients] = useState<IngredientWithStock[]>([]);
  const [name, setName] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState("piece");
  const [unitsPerPurchase, setUnitsPerPurchase] = useState<number>(1);
  const [pricePerPurchase, setPricePerPurchase] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<IngredientInput & { pricePerUnit: number }>
  >({});

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (unitsPerPurchase > 0) {
      setPricePerUnit(pricePerPurchase / unitsPerPurchase);
    }
  }, [pricePerPurchase, unitsPerPurchase]);

  const fetchIngredients = async () => {
    const res = await fetch("/api/ingredients");
    setIngredients(await res.json());
  };

  const createIngredient = async () => {
    const payload: IngredientInput = {
      name,
      measurementUnit,
      unitsPerPurchase,
      pricePerPurchase,
      stockQuantity,
    };

    await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setName("");
    setMeasurementUnit("piece");
    setUnitsPerPurchase(1);
    setPricePerPurchase(0);
    setPricePerUnit(0);
    setStockQuantity(0);
    fetchIngredients();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
    fetchIngredients();
  };

  const handleEditChange = (
    field: keyof typeof editForm,
    value: string | number
  ) => {
    const updated = { ...editForm, [field]: value };
    if (field === "pricePerPurchase" || field === "unitsPerPurchase") {
      const price = parseFloat(String(updated.pricePerPurchase ?? "")) || 0;
      const units = parseFloat(String(updated.unitsPerPurchase ?? "")) || 1;
      updated.pricePerUnit = price / units;
    }
    setEditForm(updated);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    await fetch(`/api/ingredients/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    setEditingId(null);
    setEditForm({});
    fetchIngredients();
  };

  return (
    <div className="p-6 space-y-6">
      {" "}
      <div className="flex items-center gap-2">
        <Soup size={24} className="text-green-700" />
        <h1 className="text-xl font-bold">Ingredients</h1>
      </div>
      <div className="space-y-2 border border-zinc-300 rounded-md p-4 bg-white">
        <label className="block text-sm">Ingredient Name</label>
        <input
          className="border border-zinc-300 rounded-md p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="block text-sm">Measurement Unit</label>
        <select
          className="border border-zinc-300 rounded-md p-2 w-full"
          value={measurementUnit}
          onChange={(e) => setMeasurementUnit(e.target.value)}
        >
          {measurementUnits.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>

        <label className="block text-sm">Units per Purchase</label>
        <input
          type="number"
          className="border border-zinc-300 rounded-md p-2 w-full"
          value={unitsPerPurchase}
          onChange={(e) => setUnitsPerPurchase(parseFloat(e.target.value))}
        />

        <label className="block text-sm">Price per Purchase</label>
        <input
          type="number"
          className="border border-zinc-300 rounded-md p-2 w-full"
          value={pricePerPurchase}
          onChange={(e) => setPricePerPurchase(parseFloat(e.target.value))}
        />

        <div className="text-sm text-gray-600">
          ₱{pricePerUnit.toFixed(2)} per {measurementUnit}
        </div>

        <label className="block text-sm">Initial Stock Quantity</label>
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
              setMeasurementUnit("piece");
              setUnitsPerPurchase(1);
              setPricePerPurchase(0);
              setPricePerUnit(0);
              setStockQuantity(0);
            }}
            className="bg-zinc-200 text-zinc-700 px-4 py-2 rounded-md hover:bg-zinc-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={createIngredient}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Ingredient
          </button>
        </div>
      </div>
      <table className="w-full mt-6 border border-zinc-300 text-sm bg-white rounded-md overflow-hidden">
        <thead>
          <tr className="text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Unit</th>
            <th className="p-2">Price/Unit</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((i) => (
            <tr key={i.id} className="border-t border-zinc-200 align-top">
              {editingId === i.id ? (
                <>
                  <td className="p-2">
                    <input
                      value={editForm.name ?? i.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="border border-zinc-300 p-1 w-full rounded-md"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={editForm.measurementUnit ?? i.measurementUnit}
                      onChange={(e) =>
                        handleEditChange("measurementUnit", e.target.value)
                      }
                      className="border border-zinc-300 p-1 w-full rounded-md"
                    >
                      {measurementUnits.map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={editForm.pricePerPurchase ?? i.pricePerPurchase}
                      onChange={(e) =>
                        handleEditChange(
                          "pricePerPurchase",
                          parseFloat(e.target.value)
                        )
                      }
                      className="border border-zinc-300 p-1 w-full rounded-md mb-1"
                    />
                    <input
                      type="number"
                      value={
                        editForm.unitsPerPurchase ?? i.unitsPerPurchase ?? 0
                      }
                      onChange={(e) =>
                        handleEditChange(
                          "unitsPerPurchase",
                          parseFloat(e.target.value)
                        )
                      }
                      className="border border-zinc-300 p-1 w-full rounded-md"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      ₱{(editForm.pricePerUnit ?? i.pricePerUnit).toFixed(2)}{" "}
                      per unit
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={editForm.stockQuantity ?? i.stock?.quantity ?? 0}
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
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.measurementUnit}</td>
                  <td className="p-2">₱{i.pricePerUnit.toFixed(2)}</td>
                  <td className="p-2">{i.stock?.quantity ?? 0}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(i.id);
                        setEditForm({
                          name: i.name,
                          measurementUnit: i.measurementUnit,
                          unitsPerPurchase: i.unitsPerPurchase ?? undefined,
                          pricePerPurchase: i.pricePerPurchase,
                          pricePerUnit: i.pricePerUnit,
                          stockQuantity: i.stock?.quantity ?? 0,
                        });
                      }}
                    >
                      <Pencil size={16} className="text-blue-600" />
                    </button>
                    <button onClick={() => handleDelete(i.id)}>
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
