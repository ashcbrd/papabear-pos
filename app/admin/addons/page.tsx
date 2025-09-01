"use client";

import { useState } from "react";
import { AddonInput } from "@/lib/types";
import { Pencil, Trash, UtensilsCrossed } from "lucide-react";
import { useData } from "@/lib/data-context";
import {
  AdminPageHeader,
  AdminFormSection,
  AdminInput,
  AdminButton,
  AdminTable,
  AdminActions,
  AdminCard
} from "@/components/admin";

export default function AddonsAdminPage() {
  const { addons, createAddon, updateAddon, deleteAddon } = useData();
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AddonInput>>({});

  const isFormValid = () => {
    return name.trim() !== "" && price > 0;
  };

  const handleCreateAddon = async () => {
    try {
      const payload = { name, price, stockQuantity };
      await createAddon(payload);
      
      setName("");
      setPrice(0);
      setStockQuantity(0);
    } catch (error) {
      console.error("Failed to create addon:", error);
      alert("Failed to create addon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this addon?")) return;
    try {
      await deleteAddon(id);
    } catch (error) {
      console.error("Failed to delete addon:", error);
      alert("Failed to delete addon");
    }
  };


  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateAddon(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Failed to update addon:", error);
      alert("Failed to update addon");
    }
  };

  // Prepare table columns for addons
  const tableColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row: any) => (
        <span className="font-semibold text-gray-900">
          ₱{row.price?.toFixed(2) || '0.00'}
        </span>
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
            quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {quantity} units
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
            onClick={() => {
              setEditingId(row.id);
              setEditForm({
                name: row.name,
                price: row.price,
                stockQuantity: row.stock?.quantity ?? 0,
              });
            }}
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
        title="Add-ons"
        icon={<UtensilsCrossed size={24} />}
        description="Manage optional add-ons for your products"
      />

      <AdminFormSection
        title="Create New Add-on"
        description="Add new optional items that customers can add to their orders"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminInput
            label="Add-on Name"
            placeholder="Enter add-on name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <AdminInput
            type="number"
            label="Price (₱)"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
          />

          <AdminInput
            type="number"
            label="Initial Stock Quantity"
            placeholder="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
          />
        </div>

        <AdminActions>
          <AdminButton
            variant="secondary"
            onClick={() => {
              setName("");
              setPrice(0);
              setStockQuantity(0);
            }}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={handleCreateAddon}
            disabled={!isFormValid()}
          >
            Create Add-on
          </AdminButton>
        </AdminActions>
      </AdminFormSection>

      <AdminCard>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Add-ons</h3>
          <p className="text-gray-600">Manage your existing add-ons and stock levels</p>
        </div>
        <AdminTable
          columns={tableColumns}
          data={addons}
          emptyMessage="No add-ons found. Create your first add-on above."
        />
      </AdminCard>
    </div>
  );
}
