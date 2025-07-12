"use client";

import { useEffect, useState } from "react";
import { IngredientInput, IngredientWithStock } from "@/lib/types";
import { Pencil, Trash } from "lucide-react";

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
  const [purchaseUnit, setPurchaseUnit] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState("piece");
  const [unitsPerPurchase, setUnitsPerPurchase] = useState<number>(1);
  const [pricePerPurchase, setPricePerPurchase] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<IngredientInput & { pricePerUnit: number }>
  >({});

  const fetchIngredients = async () => {
    const res = await fetch("/api/ingredients");
    const data = await res.json();
    setIngredients(data);
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (unitsPerPurchase > 0) {
      setPricePerUnit(pricePerPurchase / unitsPerPurchase);
    } else {
      setPricePerUnit(pricePerPurchase);
    }
  }, [pricePerPurchase, unitsPerPurchase]);

  const createIngredient = async () => {
    const payload: IngredientInput = {
      name,
      purchaseUnit,
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
    setPurchaseUnit("");
    setMeasurementUnit("piece");
    setUnitsPerPurchase(1);
    setPricePerPurchase(0);
    setPricePerUnit(0);
    setStockQuantity(0);

    fetchIngredients();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/ingredients/${id}`, {
      method: "DELETE",
    });
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
      <h1 className="text-xl font-bold">Ingredients</h1>

      {/* Create Ingredient Form */}
      <div className="space-y-2">
        <label className="block text-sm">Ingredient Name</label>
        <input
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="block text-sm">Purchase Unit (e.g. Tomato)</label>
        <input
          className="border p-2 w-full"
          value={purchaseUnit}
          onChange={(e) => setPurchaseUnit(e.target.value)}
        />

        <label className="block text-sm">Measurement Unit</label>
        <select
          className="border p-2 w-full"
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
          className="border p-2 w-full"
          value={unitsPerPurchase}
          onChange={(e) => setUnitsPerPurchase(parseFloat(e.target.value))}
        />

        <label className="block text-sm">Price per Purchase</label>
        <input
          type="number"
          className="border p-2 w-full"
          value={pricePerPurchase}
          onChange={(e) => setPricePerPurchase(parseFloat(e.target.value))}
        />

        <div className="text-sm text-gray-600">
          Price per {measurementUnit || "unit"}: ₱{pricePerUnit.toFixed(2)}
        </div>

        <label className="block text-sm">Initial Stock Quantity</label>
        <input
          type="number"
          className="border p-2 w-full"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(parseInt(e.target.value))}
        />

        <button
          onClick={createIngredient}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Ingredient
        </button>
      </div>

      {/* Ingredient Table */}
      <table className="w-full mt-6 border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Unit</th>
            <th className="p-2 text-left">Price/Unit</th>
            <th className="p-2 text-left">Stock</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((i) => (
            <tr key={i.id} className="border-t">
              {editingId === i.id ? (
                <>
                  <td className="p-2">
                    <input
                      value={editForm.name ?? i.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="border p-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="border p-1 w-full"
                      value={editForm.measurementUnit ?? i.measurementUnit}
                      onChange={(e) =>
                        handleEditChange("measurementUnit", e.target.value)
                      }
                    >
                      {measurementUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      <input
                        type="number"
                        placeholder="Price per purchase"
                        value={
                          editForm.pricePerPurchase ?? i.pricePerPurchase ?? 0
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "pricePerPurchase",
                            parseFloat(e.target.value)
                          )
                        }
                        className="border p-1 w-full"
                      />
                      <input
                        type="number"
                        placeholder="Units per purchase"
                        value={
                          editForm.unitsPerPurchase ?? i.unitsPerPurchase ?? 1
                        }
                        onChange={(e) =>
                          handleEditChange(
                            "unitsPerPurchase",
                            parseFloat(e.target.value)
                          )
                        }
                        className="border p-1 w-full"
                      />
                      <div className="text-xs text-gray-500">
                        ₱{(editForm.pricePerUnit ?? i.pricePerUnit).toFixed(2)}{" "}
                        per unit
                      </div>
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
                      className="border p-1 w-full"
                    />
                  </td>
                  <td className="p-2 space-x-1">
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
                  <td className="p-2 flex gap-x-2">
                    <button
                      onClick={() => {
                        setEditingId(i.id);
                        setEditForm({
                          name: i.name,
                          purchaseUnit: i.purchaseUnit,
                          measurementUnit: i.measurementUnit,
                          unitsPerPurchase: i.unitsPerPurchase ?? 1,
                          pricePerPurchase: i.pricePerPurchase,
                          pricePerUnit: i.pricePerUnit,
                          stockQuantity: i.stock?.quantity ?? 0,
                        });
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      <Pencil size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(i.id)}
                      className="text-red-600 hover:underline"
                    >
                      <Trash size={16} />
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
