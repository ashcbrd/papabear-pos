"use client";

import { useEffect, useState } from "react";
import { MaterialInput, MaterialWithStock } from "@/lib/types";
import { Boxes, Pencil, Trash, Package } from "lucide-react";
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

export default function MaterialsAdminPage() {
  const { materials, createMaterial, updateMaterial, deleteMaterial } = useData();
  const [name, setName] = useState("");
  const [isPackage, setIsPackage] = useState(false);
  const [packagePrice, setPackagePrice] = useState<number>(0);
  const [unitsPerPackage, setUnitsPerPackage] = useState<number>(0);
  const [pricePerPiece, setPricePerPiece] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<MaterialInput & { stockQuantity?: number }>
  >({});

  useEffect(() => {
    if (isPackage && packagePrice && unitsPerPackage > 0) {
      setPricePerPiece(packagePrice / unitsPerPackage);
    }
  }, [isPackage, packagePrice, unitsPerPackage]);

  const resetForm = () => {
    setEditingId(null);
    setEditForm({});
    setName("");
    setIsPackage(false);
    setPackagePrice(0);
    setUnitsPerPackage(0);
    setPricePerPiece(0);
    setStockQuantity(0);
  };

  const isFormValid = () => {
    if (editingId) {
      if (!(editForm.name || '').trim()) return false;
      if (editForm.isPackage) {
        return (editForm.packagePrice || 0) > 0 && (editForm.unitsPerPackage || 0) > 0;
      } else {
        return (editForm.pricePerPiece || 0) > 0;
      }
    } else {
      if (!name.trim()) return false;
      if (isPackage) {
        return packagePrice > 0 && unitsPerPackage > 0;
      } else {
        return pricePerPiece > 0;
      }
    }
  };

  const handleCreateMaterial = async () => {
    try {
      const payload: MaterialInput = {
        name,
        isPackage,
        packagePrice: isPackage ? packagePrice : undefined,
        unitsPerPackage: isPackage ? unitsPerPackage : undefined,
        pricePerPiece: !isPackage ? pricePerPiece : undefined,
        stockQuantity,
      };

      await createMaterial(payload);
      resetForm();
    } catch (error) {
      console.error("Failed to create material:", error);
      alert("Failed to create material");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteMaterial(id);
    } catch (error) {
      console.error("Failed to delete material:", error);
      alert("Failed to delete material");
    }
  };

  const handleEditChange = (
    field: keyof MaterialInput | "stockQuantity",
    value: string | number
  ) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    try {
      const payload = {
        name: editForm.name ?? "",
        isPackage: editForm.isPackage ?? false,
        packagePrice: editForm.isPackage ? editForm.packagePrice : undefined,
        unitsPerPackage: editForm.isPackage ? editForm.unitsPerPackage : undefined,
        pricePerPiece: !editForm.isPackage ? editForm.pricePerPiece : undefined,
        stockQuantity: editForm.stockQuantity ?? 0,
      };

      await updateMaterial(editingId, payload);
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Failed to update material:", error);
      alert("Failed to update material");
    }
  };

  const startEdit = (material: any) => {
    setEditingId(material.id);
    setEditForm({
      name: material.name,
      isPackage: material.isPackage,
      packagePrice: material.packagePrice,
      unitsPerPackage: material.unitsPerPackage,
      pricePerPiece: material.pricePerPiece,
      stockQuantity: material.stock?.quantity ?? 0,
    });
  };

  // Table columns configuration
  const tableColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Type',
      accessor: 'isPackage',
      cell: (row: any) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          row.isPackage ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {row.isPackage ? 'Package' : 'Individual'}
        </span>
      )
    },
    {
      header: 'Pricing',
      accessor: 'pricePerPiece',
      cell: (row: any) => (
        <div className="space-y-1">
          <div className="font-medium text-green-600">
            ₱{row.pricePerPiece?.toFixed(2)} per piece
          </div>
          {row.isPackage && (
            <div className="text-xs text-gray-500">
              ₱{row.packagePrice?.toFixed(2)} per {row.unitsPerPackage} pieces
            </div>
          )}
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
            quantity > 50 ? 'bg-green-100 text-green-800' :
            quantity > 20 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {quantity} pieces
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
        title="Materials"
        icon={<Boxes size={24} />}
        description="Manage your restaurant's materials, packaging, and supplies"
      />

      <AdminFormSection
        title={editingId ? "Edit Material" : "Create New Material"}
        description={editingId ? "Update material details and pricing" : "Add a new material with pricing and initial stock information"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInput
            label="Material Name"
            placeholder="Enter material name"
            value={editingId ? (editForm.name || '') : name}
            onChange={(e) => {
              if (editingId) {
                setEditForm(prev => ({ ...prev, name: e.target.value }));
              } else {
                setName(e.target.value);
              }
            }}
          />

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Type
            </label>
            <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={editingId ? (editForm.isPackage || false) : isPackage}
                onChange={(e) => {
                  if (editingId) {
                    setEditForm(prev => ({ ...prev, isPackage: e.target.checked }));
                  } else {
                    setIsPackage(e.target.checked);
                  }
                }}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
              />
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Sold as a package</span>
              </div>
            </label>
          </div>
        </div>

        {(editingId ? (editForm.isPackage || false) : isPackage) ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdminInput
              type="number"
              label="Package Price (₱)"
              placeholder="0.00"
              value={editingId ? (editForm.packagePrice || 0) : packagePrice}
              onChange={(e) => {
                const newPrice = parseFloat(e.target.value) || 0;
                if (editingId) {
                  setEditForm(prev => ({ ...prev, packagePrice: newPrice }));
                } else {
                  setPackagePrice(newPrice);
                }
              }}
            />

            <AdminInput
              type="number"
              label="Units per Package"
              placeholder="0"
              value={editingId ? (editForm.unitsPerPackage || 0) : unitsPerPackage}
              onChange={(e) => {
                const newUnits = parseInt(e.target.value) || 0;
                if (editingId) {
                  setEditForm(prev => ({ ...prev, unitsPerPackage: newUnits }));
                } else {
                  setUnitsPerPackage(newUnits);
                }
              }}
            />

            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculated Price per Piece
              </label>
              <div className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="text-lg font-semibold text-purple-800">
                  ₱{(editingId ? (editForm.pricePerPiece || 0) : pricePerPiece).toFixed(2)} per piece
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminInput
              type="number"
              label="Price per Piece (₱)"
              placeholder="0.00"
              value={editingId ? (editForm.pricePerPiece || 0) : pricePerPiece}
              onChange={(e) => {
                const newPrice = parseFloat(e.target.value) || 0;
                if (editingId) {
                  setEditForm(prev => ({ ...prev, pricePerPiece: newPrice }));
                } else {
                  setPricePerPiece(newPrice);
                }
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInput
            type="number"
            label="Initial Stock Quantity"
            placeholder="0"
            value={editingId ? (editForm.stockQuantity || 0) : stockQuantity}
            onChange={(e) => {
              const newQuantity = parseInt(e.target.value) || 0;
              if (editingId) {
                setEditForm(prev => ({ ...prev, stockQuantity: newQuantity }));
              } else {
                setStockQuantity(newQuantity);
              }
            }}
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
            onClick={editingId ? saveEdit : handleCreateMaterial}
            disabled={!isFormValid()}
          >
            {editingId ? "Update Material" : "Create Material"}
          </AdminButton>
        </AdminActions>
      </AdminFormSection>

      <AdminCard>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Materials</h3>
          <p className="text-gray-600">Manage and edit your existing materials</p>
        </div>
        <AdminTable
          columns={tableColumns}
          data={materials}
          emptyMessage="No materials found. Create your first material above."
        />
      </AdminCard>
    </div>
  );
}