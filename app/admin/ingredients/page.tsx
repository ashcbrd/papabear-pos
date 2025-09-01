"use client";

import { useEffect, useState } from "react";
import { IngredientInput, IngredientWithStock } from "@/lib/types";
import { Pencil, Soup, Trash, Save, X } from "lucide-react";
import { useData } from "@/lib/data-context";
import {
  AdminPageHeader,
  AdminFormSection,
  AdminInput,
  AdminSelect,
  AdminButton,
  AdminTable,
  AdminActions,
  AdminCard
} from "@/components/admin";

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
  const { ingredients, createIngredient, updateIngredient, deleteIngredient } = useData();
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
    if (unitsPerPurchase > 0) {
      setPricePerUnit(pricePerPurchase / unitsPerPurchase);
    }
  }, [pricePerPurchase, unitsPerPurchase]);

  const resetForm = () => {
    setName("");
    setMeasurementUnit("piece");
    setUnitsPerPurchase(1);
    setPricePerPurchase(0);
    setPricePerUnit(0);
    setStockQuantity(0);
  };

  const handleCreateIngredient = async () => {
    try {
      const payload: IngredientInput = {
        name,
        measurementUnit,
        unitsPerPurchase,
        pricePerPurchase,
        stockQuantity,
      };

      await createIngredient(payload);
      resetForm();
    } catch (error) {
      console.error("Failed to create ingredient:", error);
      alert("Failed to create ingredient");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;
    try {
      await deleteIngredient(id);
    } catch (error) {
      console.error("Failed to delete ingredient:", error);
      alert("Failed to delete ingredient");
    }
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

    try {
      await updateIngredient(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Failed to update ingredient:", error);
      alert("Failed to update ingredient");
    }
  };

  const startEdit = (ingredient: any) => {
    setEditingId(ingredient.id);
    setEditForm({
      name: ingredient.name,
      measurementUnit: ingredient.measurementUnit,
      unitsPerPurchase: ingredient.unitsPerPurchase ?? undefined,
      pricePerPurchase: ingredient.pricePerPurchase,
      pricePerUnit: ingredient.pricePerUnit,
      stockQuantity: ingredient.stock?.quantity ?? 0,
    });
  };

  // Table columns configuration
  const tableColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Unit',
      accessor: 'measurementUnit',
      cell: (row: any) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {row.measurementUnit}
        </span>
      )
    },
    {
      header: 'Price/Purchase',
      accessor: 'pricePerPurchase',
      cell: (row: any) => (
        <div className="space-y-1">
          <div className="font-medium">₱{row.pricePerPurchase?.toFixed(2)}</div>
          <div className="text-xs text-gray-500">
            {row.unitsPerPurchase} {row.measurementUnit}(s)
          </div>
        </div>
      )
    },
    {
      header: 'Price/Unit',
      accessor: 'pricePerUnit',
      cell: (row: any) => (
        <div className="font-medium text-green-600">
          ₱{row.pricePerUnit?.toFixed(2)}
        </div>
      )
    },
    {
      header: 'Stock',
      accessor: 'stock',
      cell: (row: any) => {
        const quantity = row.stock?.quantity ?? 0;
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            quantity > 10 ? 'bg-green-100 text-green-800' :
            quantity > 5 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {quantity} {row.measurementUnit}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <AdminButton
            size="sm"
            variant="outline"
            icon={<Pencil size={14} />}
            onClick={() => startEdit(row)}
          >
            Edit
          </AdminButton>
          <AdminButton
            size="sm"
            variant="danger"
            icon={<Trash size={14} />}
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </AdminButton>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Ingredients"
        icon={<Soup size={24} />}
        description="Manage your restaurant's ingredients, pricing, and stock levels"
      />

      <AdminFormSection
        title="Create New Ingredient"
        description="Add a new ingredient with pricing and initial stock information"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInput
            label="Ingredient Name"
            placeholder="Enter ingredient name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <AdminSelect
            label="Measurement Unit"
            value={measurementUnit}
            onChange={(e) => setMeasurementUnit(e.target.value)}
            options={measurementUnits.map(unit => ({ label: unit, value: unit }))}
          />

          <AdminInput
            type="number"
            label="Units per Purchase"
            placeholder="1"
            value={unitsPerPurchase}
            onChange={(e) => setUnitsPerPurchase(parseFloat(e.target.value) || 1)}
          />

          <AdminInput
            type="number"
            label="Price per Purchase (₱)"
            placeholder="0.00"
            value={pricePerPurchase}
            onChange={(e) => setPricePerPurchase(parseFloat(e.target.value) || 0)}
          />

          <AdminInput
            type="number"
            label="Initial Stock Quantity"
            placeholder="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
          />

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calculated Price per Unit
            </label>
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-lg font-semibold text-green-800">
                ₱{pricePerUnit.toFixed(2)} per {measurementUnit}
              </span>
            </div>
          </div>
        </div>

        <AdminActions>
          <AdminButton
            variant="secondary"
            onClick={resetForm}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={handleCreateIngredient}
          >
            Create Ingredient
          </AdminButton>
        </AdminActions>
      </AdminFormSection>

      <AdminCard>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Ingredients</h3>
          <p className="text-gray-600">Manage and edit your existing ingredients</p>
        </div>
        <AdminTable
          columns={tableColumns}
          data={ingredients}
          emptyMessage="No ingredients found. Create your first ingredient above."
        />
      </AdminCard>
    </div>
  );
}