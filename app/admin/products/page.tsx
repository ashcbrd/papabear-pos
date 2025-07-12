"use client";

import { useEffect, useState } from "react";
import { Category, Ingredient, Material } from "@prisma/client";
import { Pencil, Trash } from "lucide-react";

type VariantName = "general" | "small" | "medium" | "large" | "16oz" | "22oz";
const allVariantOptions: VariantName[] = [
  "general",
  "small",
  "medium",
  "large",
  "16oz",
  "22oz",
];

interface VariantInput {
  name: VariantName;
  price: number;
  materials: { id: string; quantity: number }[];
  ingredients: { id: string; quantity: number }[];
}

interface Product {
  id: string;
  name: string;
  category: Category;
  imageUrl: string | null;
  variants: {
    id: string;
    name: VariantName;
    price: number;
    materials: { material: Material; quantityUsed: number }[];
    ingredients: { ingredient: Ingredient; quantityUsed: number }[];
  }[];
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("InsideMeals");
  const [variants, setVariants] = useState<VariantInput[]>([
    { name: "general", price: 0, materials: [], ingredients: [] },
  ]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const loadAll = async () => {
    setProducts(await (await fetch("/api/products")).json());
    setMaterials(await (await fetch("/api/materials")).json());
    setIngredients(await (await fetch("/api/ingredients")).json());
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetForm = () => {
    setEditingProductId(null);
    setName("");
    setCategory("InsideMeals");
    setVariants([
      { name: "general", price: 0, materials: [], ingredients: [] },
    ]);
  };

  const handleSave = async () => {
    const payload = { name, category, variants };
    const method = editingProductId ? "PUT" : "POST";
    const url = editingProductId
      ? `/api/products/${editingProductId}`
      : "/api/products";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      resetForm();
      loadAll();
    } else {
      console.error(await res.text());
      alert("Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) loadAll();
    else console.error(await res.text());
  };

  const startEdit = (p: Product) => {
    setEditingProductId(p.id);
    setName(p.name);
    setCategory(p.category);
    setVariants(
      p.variants.map((v) => ({
        name: v.name,
        price: v.price,
        materials: v.materials.map((m) => ({
          id: m.material.id,
          quantity: m.quantityUsed,
        })),
        ingredients: v.ingredients.map((i) => ({
          id: i.ingredient.id,
          quantity: i.quantityUsed,
        })),
      }))
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Products</h1>
      <div className="space-y-2">
        <input
          placeholder="Product Name"
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="border p-2 w-full"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          <option value="InsideMeals">Inside Meals</option>
          <option value="OutsideSnacks">Outside Snacks</option>
          <option value="InsideBeverages">Inside Beverages</option>
        </select>

        {variants.map((variant, idx) => (
          <VariantEditor
            key={idx}
            idx={idx}
            variant={variant}
            variants={variants}
            setVariants={setVariants}
            materials={materials}
            ingredients={ingredients}
          />
        ))}

        <button
          className="text-sm text-blue-600 underline"
          disabled={variants.length >= allVariantOptions.length}
          onClick={() =>
            setVariants([
              ...variants,
              {
                name: allVariantOptions.find(
                  (opt) => !variants.some((v) => v.name === opt)
                )!,
                price: 0,
                materials: [],
                ingredients: [],
              },
            ])
          }
        >
          + Add Variant
        </button>

        <button
          onClick={handleSave}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingProductId ? "Update Product" : "Save Product"}
        </button>
      </div>

      <ProductTable
        products={products}
        materials={materials}
        ingredients={ingredients}
        onEdit={startEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function VariantEditor({
  idx,
  variant,
  variants,
  setVariants,
  materials,
  ingredients,
}: {
  idx: number;
  variant: VariantInput;
  variants: VariantInput[];
  setVariants: React.Dispatch<React.SetStateAction<VariantInput[]>>;
  materials: Material[];
  ingredients: Ingredient[];
}) {
  const update = (v: VariantInput) =>
    setVariants(variants.map((x, i) => (i === idx ? v : x)));

  return (
    <div key={idx} className="border p-4 mt-4 rounded bg-gray-50">
      <div className="flex gap-2">
        <select
          value={variant.name}
          onChange={(e) =>
            update({ ...variant, name: e.target.value as VariantName })
          }
          className="border p-1"
        >
          {allVariantOptions
            .filter(
              (opt) =>
                opt === variant.name || !variants.some((v) => v.name === opt)
            )
            .map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
        </select>

        <input
          type="number"
          className="border p-1 w-24"
          value={variant.price}
          onChange={(e) =>
            update({ ...variant, price: parseFloat(e.target.value) })
          }
        />
      </div>

      <NestedSelectors
        title="Materials"
        items={variant.materials}
        all={materials}
        onChange={(materials) => update({ ...variant, materials })}
      />

      <NestedSelectors
        title="Ingredients"
        items={variant.ingredients}
        all={ingredients}
        onChange={(ingredients) => update({ ...variant, ingredients })}
      />
    </div>
  );
}

function NestedSelectors<T extends { id: string; name: string }>({
  title,
  items,
  all,
  onChange,
}: {
  title: string;
  items: { id: string; quantity: number }[];
  all: T[];
  onChange: (items: { id: string; quantity: number }[]) => void;
}) {
  return (
    <div className="mt-4">
      <h3 className="font-medium">{title}</h3>
      <select
        className="border p-2 w-full mt-1"
        onChange={(e) => {
          const id = e.target.value;
          if (!id) return;
          onChange([...items, { id, quantity: 1 }]);
        }}
      >
        <option value="">+ Add {title.slice(0, -1)}</option>
        {all
          .filter((x) => !items.some((it) => it.id === x.id))
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
      </select>

      {items.map((it, i) => {
        const obj = all.find((x) => x.id === it.id);
        return (
          <div key={it.id} className="flex gap-2 items-center mt-1">
            <span className="w-32 text-sm">{obj?.name || "Unknown"}</span>
            <input
              type="number"
              className="border p-1 w-20"
              value={it.quantity}
              onChange={(e) => {
                const arr = [...items];
                arr[i].quantity = parseFloat(e.target.value);
                onChange(arr);
              }}
            />
            <button
              className="text-red-500 text-sm"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ProductTable({
  products,
  materials,
  ingredients,
  onEdit,
  onDelete,
}: {
  products: Product[];
  materials: Material[];
  ingredients: Ingredient[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <table className="w-full mt-8 border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">Name</th>
          <th className="p-2 text-left">Category</th>
          <th className="p-2 text-left">Variants</th>
          <th className="p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id} className="border-t align-top">
            <td className="p-2">{p.name}</td>
            <td className="p-2">{p.category}</td>
            <td className="p-2">
              {p.variants.map((v) => (
                <div key={v.id} className="mb-2">
                  <strong>{v.name}</strong> - ₱{v.price.toFixed(2)}
                  <div className="text-xs text-gray-600">Materials:</div>
                  {v.materials.map((m, i) => (
                    <div key={i} className="text-xs ml-2">
                      {materials.find((x) => x.id === m.material.id)?.name ||
                        "Unknown"}{" "}
                      ({m.quantityUsed})
                    </div>
                  ))}
                  <div className="text-xs text-gray-600">Ingredients:</div>
                  {v.ingredients.map((ing, i) => (
                    <div key={i} className="text-xs ml-2">
                      {ingredients.find((x) => x.id === ing.ingredient.id)
                        ?.name || "Unknown"}{" "}
                      ({ing.quantityUsed})
                    </div>
                  ))}
                </div>
              ))}
            </td>
            <td className="p-2 space-x-2">
              <button className="text-blue-600" onClick={() => onEdit(p)}>
                <Pencil size={16} />
              </button>
              <button className="text-red-600" onClick={() => onDelete(p.id)}>
                <Trash size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
