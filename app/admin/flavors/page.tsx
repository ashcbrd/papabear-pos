"use client";

import { useState } from "react";
import { Palette, Pencil, Trash, Plus } from "lucide-react";
import { useData } from "@/lib/data-context";
import { formatDate } from "@/lib/date-utils";
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

const PAPA_BEAR_FLAVORS = [
  "Americano", "Cinnamon", "Salted Caramel", "Creamy Vanilla", "Mocha", "Honeycomb Latte", 
  "Tiramisu", "Caramel Macchiato", "Spanish Latte", "Matcha Latte", "Matcha Caramel", 
  "Mango Matcha Latte", "Strawberry Matcha Latte", "Blueberry Matcha Latte", "Coffee Float", 
  "Strawberry Float", "Blueberry Float", "Sprite Float", "Coke Float", "Matcha Float", 
  "Kiwi Will Rock You", "Blueberry Licious", "Tipsy Strawberry", "Edi Wow Grape", 
  "Mango Tango", "Honey Orange Ginger", "Okinawa", "Taro", "Wintermelon", "Red Velvet", 
  "Cookies and Cream", "Chocolate", "Mango Cheesecake", "Matcha", "Minty Matcha", 
  "Choco Mint", "Blueberry Graham", "Mango Graham", "Avocado Graham", "Cookies and Cream Graham", 
  "Dark Chocolate S'mores", "Matcha S'mores", "Red Velvet S'mores", "Caramel Macchiato S'mores", 
  "Cookies and Cream S'mores", "Lemonade", "Tropical Berry Lemon", "Kiwi Lemonade", 
  "Honey Lemon", "Hot Choco"
];

export default function FlavorsAdminPage() {
  const { flavors, createFlavor, updateFlavor, deleteFlavor } = useData();
  
  const [name, setName] = useState("");
  const [editingFlavorId, setEditingFlavorId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleBulkImport = async () => {
    if (!confirm("This will delete all existing flavors and import the Papa Bear flavor list. Continue?")) return;
    
    setIsImporting(true);
    try {
      // Delete all existing flavors
      for (const flavor of flavors) {
        await deleteFlavor(flavor.id);
      }
      
      // Add all Papa Bear flavors
      for (const flavorName of PAPA_BEAR_FLAVORS) {
        await createFlavor({ name: flavorName });
      }
      
      alert(`Successfully imported ${PAPA_BEAR_FLAVORS.length} flavors!`);
    } catch (error) {
      console.error("Bulk import failed:", error);
      alert("Bulk import failed. Please try again.");
    } finally {
      setIsImporting(false);
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
          {formatDate(row.createdAt)}
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
        actions={
          <AdminButton
            variant="primary"
            onClick={handleBulkImport}
            disabled={isImporting}
            icon={<Plus size={16} />}
          >
            {isImporting ? "Importing..." : "Import Papa Bear Flavors"}
          </AdminButton>
        }
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