"use client";

import { useEffect, useState } from "react";
import { MaterialInput, MaterialWithStock } from "@/lib/types";
import { Boxes, Pencil, Trash } from "lucide-react";

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
      isPackage,
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
      <div className="flex items-center gap-2">
        <Boxes size={24} className="text-green-700" />
        <h1 className="text-xl font-bold">Materials</h1>
      </div>

      <div className="space-y-4 bg-white border border-zinc-300 p-4 rounded-md">
        <div>
          <label className="block text-sm mb-1">Material Name</label>
          <input
            className="border border-zinc-300 p-2 w-full rounded-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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
            <div>
              <label className="block text-sm mb-1">Package Price</label>
              <input
                type="number"
                className="border border-zinc-300 p-2 w-full rounded-md"
                value={packagePrice}
                onChange={(e) => setPackagePrice(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Units per Package</label>
              <input
                type="number"
                className="border border-zinc-300 p-2 w-full rounded-md"
                value={unitsPerPackage}
                onChange={(e) => setUnitsPerPackage(parseInt(e.target.value))}
              />
            </div>
            <div className="text-sm text-gray-600">
              Auto price per piece: ₱{pricePerPiece.toFixed(2)}
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm mb-1">Price per Piece</label>
            <input
              type="number"
              className="border border-zinc-300 p-2 w-full rounded-md"
              value={pricePerPiece}
              onChange={(e) => setPricePerPiece(parseFloat(e.target.value))}
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-1">Initial Stock Quantity</label>
          <input
            type="number"
            className="border border-zinc-300 p-2 w-full rounded-md"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(parseInt(e.target.value))}
          />
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              setName("");
              setIsPackage(false);
              setPackagePrice(0);
              setUnitsPerPackage(0);
              setPricePerPiece(0);
              setStockQuantity(0);
            }}
            className="bg-zinc-200 text-zinc-700 px-4 py-2 rounded-md hover:bg-zinc-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={createMaterial}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Material
          </button>
        </div>
      </div>

      <table className="w-full mt-6 border border-zinc-300 text-sm bg-white rounded-md overflow-hidden">
        <thead>
          <tr className="text-left ">
            <th className="p-2 text-left border-y border-zinc-300">Name</th>
            <th className="p-2 text-left border-y border-zinc-300">
              Price/Piece
            </th>
            <th className="p-2 text-left border-y border-zinc-300">Stock</th>
            <th className="p-2 text-left border-y border-zinc-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id} className="border-t border-zinc-300">
              {editingId === m.id ? (
                <>
                  <td className="p-2 border-y border-zinc-300">
                    <input
                      value={editForm.name ?? m.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="border border-zinc-300 p-1 w-full rounded-md"
                    />
                  </td>
                  <td className="p-2 border-y border-zinc-300">
                    <input
                      type="number"
                      value={editForm.pricePerPiece ?? m.pricePerPiece}
                      onChange={(e) =>
                        handleEditChange(
                          "pricePerPiece",
                          parseFloat(e.target.value)
                        )
                      }
                      className="border border-zinc-300 p-1 w-full rounded-md"
                    />
                  </td>
                  <td className="p-2 border-y border-zinc-300">
                    <input
                      type="number"
                      value={editForm.stockQuantity ?? m.stock?.quantity ?? 0}
                      onChange={(e) =>
                        handleEditChange(
                          "stockQuantity",
                          parseInt(e.target.value)
                        )
                      }
                      className="border border-zinc-300 p-1 w-full rounded-md"
                    />
                  </td>
                  <td className="p-2 space-x-2 border border-zinc-300">
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
                  <td className="p-2 border-y border-zinc-300">{m.name}</td>
                  <td className="p-2 border-y border-zinc-300">
                    ₱{m.pricePerPiece.toFixed(2)}
                  </td>
                  <td className="p-2 border-y border-zinc-300">
                    {m.stock?.quantity ?? 0}
                  </td>
                  <td className="p-2 flex gap-2  border-zinc-300">
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
                      <Pencil size={16} />
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
