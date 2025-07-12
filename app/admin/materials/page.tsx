"use client";

import { useEffect, useState } from "react";
import { MaterialInput, MaterialWithStock } from "@/lib/types";
import { Pencil, Trash } from "lucide-react";

export default function MaterialsAdminPage() {
  const [materials, setMaterials] = useState<MaterialWithStock[]>([]);
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

  const fetchMaterials = async () => {
    const res = await fetch("/api/materials");
    setMaterials(await res.json());
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (isPackage && packagePrice && unitsPerPackage > 0) {
      setPricePerPiece(packagePrice / unitsPerPackage);
    }
  }, [isPackage, packagePrice, unitsPerPackage]);

  const createMaterial = async () => {
    const payload: MaterialInput = {
      name,
      isPackage,
      packagePrice: isPackage ? packagePrice : undefined,
      unitsPerPackage: isPackage ? unitsPerPackage : undefined,
      pricePerPiece: !isPackage ? pricePerPiece : undefined,
      stockQuantity,
    };

    await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setName("");
    setIsPackage(false);
    setPackagePrice(0);
    setUnitsPerPackage(0);
    setPricePerPiece(0);
    setStockQuantity(0);

    fetchMaterials();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/materials/${id}`, { method: "DELETE" });
    fetchMaterials();
  };

  const handleEditChange = (
    field: keyof MaterialInput | "stockQuantity",
    value: string | number
  ) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const payload = {
      name: editForm.name ?? "",
      isPackage: isPackage, // This must be sent
      packagePrice: isPackage ? packagePrice : undefined,
      unitsPerPackage: isPackage ? unitsPerPackage : undefined,
      pricePerPiece: !isPackage ? editForm.pricePerPiece : undefined,
      stockQuantity: editForm.stockQuantity ?? 0,
    };

    await fetch(`/api/materials/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setEditingId(null);
    setEditForm({});
    fetchMaterials();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Materials</h1>

      <div className="space-y-2">
        <label className="block text-sm">Material name</label>
        <input
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPackage}
            onChange={(e) => setIsPackage(e.target.checked)}
          />
          Sold as a package?
        </label>

        {isPackage ? (
          <>
            <label className="block text-sm">Package Price</label>
            <input
              type="number"
              className="border p-2 w-full"
              value={packagePrice}
              onChange={(e) => setPackagePrice(parseFloat(e.target.value))}
            />

            <label className="block text-sm">Units per Package</label>
            <input
              type="number"
              className="border p-2 w-full"
              value={unitsPerPackage}
              onChange={(e) => setUnitsPerPackage(parseInt(e.target.value))}
            />

            <div className="text-sm text-gray-600">
              Auto price per piece: ₱{pricePerPiece.toFixed(2)}
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm">Price per Piece</label>
            <input
              type="number"
              className="border p-2 w-full"
              value={pricePerPiece}
              onChange={(e) => setPricePerPiece(parseFloat(e.target.value))}
            />
          </>
        )}

        <label className="block text-sm">Initial Stock Quantity</label>
        <input
          type="number"
          className="border p-2 w-full"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(parseInt(e.target.value))}
        />

        <button
          onClick={createMaterial}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Material
        </button>
      </div>

      <table className="w-full mt-6 border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Price/Piece</th>
            <th className="p-2 text-left">Stock</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id} className="border-t">
              {editingId === m.id ? (
                <>
                  <td className="p-2">
                    <input
                      value={editForm.name ?? m.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="border p-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={editForm.pricePerPiece ?? m.pricePerPiece}
                      onChange={(e) =>
                        handleEditChange(
                          "pricePerPiece",
                          parseFloat(e.target.value)
                        )
                      }
                      className="border p-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={editForm.stockQuantity ?? m.stock?.quantity ?? 0}
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
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">₱{m.pricePerPiece.toFixed(2)}</td>
                  <td className="p-2">{m.stock?.quantity ?? 0}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(m.id);
                        setEditForm({
                          name: m.name,
                          pricePerPiece: m.pricePerPiece,
                          stockQuantity: m.stock?.quantity ?? 0,
                        });
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      <Pencil size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
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
