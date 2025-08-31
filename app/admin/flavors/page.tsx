"use client";

import { useState } from "react";
import { Palette, Pencil, Trash, Plus } from "lucide-react";
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

interface Flavor {
  id: string;
  name: string;
  createdAt: string;
}

export default function FlavorsAdminPage() {
  const { flavors, createFlavor, updateFlavor, deleteFlavor } = useData();
  
  const [name, setName] = useState("");
  const [editingFlavorId, setEditingFlavorId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingFlavorId(null);
    setName("");
  };

  const handleSave = async () => {
    try {
      if (editingFlavorId) {
        await updateFlavor(editingFlavorId, { name });
      } else {
        await createFlavor({ name });
      }
      resetForm();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this flavor?")) return;
    try {
      await deleteFlavor(id);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed");
    }
  };

  const startEdit = (flavor: Flavor) => {
    setEditingFlavorId(flavor.id);
    setName(flavor.name);
  };

  const tableColumns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (row: Flavor) => (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      cell: (row: Flavor) => (
        <span className="text-gray-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (row: Flavor) => (
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
        title="Flavors"
        icon={<Palette size={24} />}
        description="Manage available flavors for your products"
      />

      <AdminFormSection
        title="Create New Flavor"
        description="Add a new flavor option for products"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInput
            label="Flavor Name"
            placeholder="Enter flavor name (e.g., Vanilla, Chocolate)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {editingFlavorId ? "Update Flavor" : "Create Flavor"}
          </AdminButton>
        </AdminActions>
      </AdminFormSection>

      <AdminCard>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Flavors</h3>
          <p className="text-gray-600">Manage and edit your available flavors</p>
        </div>
        <AdminTable
          columns={tableColumns}
          data={flavors}
          emptyMessage="No flavors found. Create your first flavor above."
        />
      </AdminCard>
    </div>
  );
}