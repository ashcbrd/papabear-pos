"use client";

import { useState, useEffect } from "react";
import { Palette, Pencil, Trash, Plus, Package, X } from "lucide-react";
import { useData } from "@/lib/data-context";
import { formatDate } from "@/lib/date-utils";
import {
  AdminPageHeader,
  AdminFormSection,
  AdminInput,
  AdminButton,
  AdminTable,
  AdminActions,
  AdminCard,
  AdminSelect
} from "@/components/admin";

interface Flavor {
  id: string;
  name: string;
  createdAt: string;
  ingredients?: Array<{
    id: string;
    name: string;
    measurementUnit: string;
    quantity: number;
  }>;
}

interface Ingredient {
  id: string;
  name: string;
  measurementUnit: string;
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
  const { 
    flavors, 
    ingredients,
    createFlavor, 
    updateFlavor, 
    deleteFlavor, 
    importPapaBearFlavors, 
    loadFlavors,
    loadIngredients,
    getFlavorsWithIngredients,
    addFlavorIngredient,
    removeFlavorIngredient,
    updateFlavorIngredient,
    getFlavorIngredients
  } = useData();
  
  const [name, setName] = useState("");
  const [editingFlavorId, setEditingFlavorId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [flavorsWithIngredients, setFlavorsWithIngredients] = useState<Flavor[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{id: string, quantity: number}>>([{ id: "", quantity: 0 }]);

  useEffect(() => {
    loadFlavorsWithIngredients();
    loadIngredients();
  }, []);

  const loadFlavorsWithIngredients = async () => {
    try {
      const flavorsWithIngredients = await getFlavorsWithIngredients();
      setFlavorsWithIngredients(flavorsWithIngredients);
    } catch (error) {
      console.error("Failed to load flavors with ingredients:", error);
    }
  };

  const resetForm = () => {
    setEditingFlavorId(null);
    setName("");
    setSelectedIngredients([{ id: "", quantity: 0 }]); // Start with one ingredient slot
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a flavor name");
      return;
    }

    // Validate ingredients
    const validIngredients = selectedIngredients.filter(ing => ing.id && ing.quantity > 0);
    if (validIngredients.length === 0) {
      alert("Please add at least one ingredient to this flavor");
      return;
    }

    try {
      let flavorId: string;
      
      if (editingFlavorId) {
        await updateFlavor(editingFlavorId, { name: name.trim() });
        flavorId = editingFlavorId;
        
        // Clear existing ingredients for this flavor
        const existingIngredients = await getFlavorIngredients(editingFlavorId);
        for (const ingredient of existingIngredients) {
          await removeFlavorIngredient(editingFlavorId, ingredient.id);
        }
      } else {
        console.log("Creating flavor with name:", name.trim());
        const newFlavor = await createFlavor({ name: name.trim() });
        console.log("Created flavor result:", newFlavor);
        
        if (!newFlavor || !newFlavor.id) {
          throw new Error("Failed to create flavor - no ID returned");
        }
        
        flavorId = newFlavor.id;
        console.log("Flavor ID to use:", flavorId);
      }

      // Add selected ingredients (only valid ones)
      console.log("Adding ingredients:", validIngredients);
      for (const ingredient of validIngredients) {
        console.log("Adding ingredient:", ingredient.id, "quantity:", ingredient.quantity, "to flavor:", flavorId);
        await addFlavorIngredient(flavorId, ingredient.id, ingredient.quantity);
      }

      resetForm();
      await loadFlavorsWithIngredients();
    } catch (error) {
      console.error("Save failed:", error);
      alert(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const addIngredientToSelection = () => {
    setSelectedIngredients([...selectedIngredients, { id: "", quantity: 0 }]);
  };

  const removeIngredientFromSelection = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateSelectedIngredient = (index: number, field: 'id' | 'quantity', value: string | number) => {
    const updated = [...selectedIngredients];
    if (field === 'id') {
      updated[index].id = value as string;
    } else {
      updated[index].quantity = value as number;
    }
    setSelectedIngredients(updated);
  };

  const startEdit = async (flavor: Flavor) => {
    setEditingFlavorId(flavor.id);
    setName(flavor.name);
    
    // Load existing ingredients for this flavor
    try {
      const flavorIngredients = await getFlavorIngredients(flavor.id);
      setSelectedIngredients(flavorIngredients.map(ing => ({
        id: ing.id,
        quantity: ing.quantity
      })));
    } catch (error) {
      console.error("Failed to load flavor ingredients:", error);
      setSelectedIngredients([]);
    }
  };

  const handleBulkImport = async () => {
    if (!confirm("This will delete all existing flavors and import the Papa Bear flavor list. Continue?")) return;
    
    setIsImporting(true);
    try {
      const importedCount = await importPapaBearFlavors();
      await loadFlavorsWithIngredients();
      alert(`Successfully imported ${importedCount} flavors!`);
    } catch (error) {
      console.error("Bulk import failed:", error);
      alert(`Bulk import failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const flavorToDelete = flavors.find(f => f.id === id);
    if (!flavorToDelete) {
      alert("Flavor not found");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${flavorToDelete.name}"?`)) return;
    
    try {
      await deleteFlavor(id);
      await loadFlavorsWithIngredients();
    } catch (error) {
      console.error("Failed to delete flavor:", error);
      alert("Failed to delete flavor");
    }
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
      header: 'Ingredients',
      accessor: 'ingredients',
      cell: (row: Flavor) => {
        const flavor = flavorsWithIngredients.find(f => f.id === row.id);
        const ingredientsList = flavor?.ingredients || [];
        
        if (ingredientsList.length === 0) {
          return <span className="text-sm text-gray-400 italic">No ingredients</span>;
        }
        
        return (
          <div className="text-sm text-gray-600">
            {ingredientsList.map((ing: any) => (
              <div key={ing.id} className="flex items-center gap-1">
                <Package size={12} className="text-gray-400" />
                <span>{ing.name}: {ing.quantity} {ing.measurementUnit}</span>
              </div>
            ))}
          </div>
        );
      }
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
        title="Flavors & Ingredients"
        icon={<Palette size={24} />}
        description="Create flavors and configure their ingredient requirements"
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
        title={editingFlavorId ? "Edit Flavor" : "Create New Flavor"}
        description="Add a flavor with its required ingredients and quantities"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminInput
              label="Flavor Name"
              placeholder="Enter flavor name (e.g., Vanilla, Chocolate)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Required Ingredients</h4>
              <AdminButton
                size="sm"
                variant="outline"
                icon={<Plus size={14} />}
                onClick={addIngredientToSelection}
              >
                Add Ingredient
              </AdminButton>
            </div>

            <div className="space-y-3">
              {selectedIngredients.map((selectedIngredient, index) => {
                const ingredient = ingredients.find(ing => ing.id === selectedIngredient.id);
                return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="md:col-span-2">
                      <AdminSelect
                        label="Select Ingredient"
                        placeholder="Choose an ingredient..."
                        value={selectedIngredient.id}
                        onChange={(e) => updateSelectedIngredient(index, 'id', e.target.value)}
                        options={ingredients.map(ingredient => ({
                          label: `${ingredient.name} (${ingredient.measurementUnit})${ingredient.stock ? ` - Stock: ${ingredient.stock.quantity}` : ' - No stock info'}`,
                          value: ingredient.id
                        }))}
                        icon={<Package size={16} />}
                      />
                    </div>

                    <AdminInput
                      label="Quantity"
                      placeholder="e.g., 15"
                      value={selectedIngredient.quantity.toString()}
                      onChange={(e) => updateSelectedIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                      type="number"
                      min="0"
                      step="0.1"
                    />

                    <div className="flex items-end">
                      <AdminButton
                        size="sm"
                        variant="danger"
                        icon={<X size={14} />}
                        onClick={() => removeIngredientFromSelection(index)}
                        className="w-full"
                      >
                        Remove
                      </AdminButton>
                    </div>

                    {ingredient && (
                      <div className="md:col-span-4 text-sm text-gray-600 bg-white p-3 rounded border">
                        <div className="flex items-center gap-4">
                          <span><strong>Unit:</strong> {ingredient.measurementUnit}</span>
                          {ingredient.stock && (
                            <span className={`${ingredient.stock.quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                              <strong>Current Stock:</strong> {ingredient.stock.quantity} {ingredient.measurementUnit}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedIngredients.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-medium">No ingredients configured</p>
                  <p className="text-sm">Click "Add Ingredient" to define what ingredients this flavor requires</p>
                </div>
              )}
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
              onClick={handleSave}
              disabled={!name.trim()}
            >
              {editingFlavorId ? "Update Flavor" : "Create Flavor"}
            </AdminButton>
          </AdminActions>
        </div>
      </AdminFormSection>

      <AdminCard>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Flavors</h3>
          <p className="text-gray-600">View and manage your available flavors with their ingredient requirements</p>
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