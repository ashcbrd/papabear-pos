"use client";

import { useEffect, useState } from "react";
import { Category, Ingredient, Material } from "@prisma/client";
import { Pencil, Trash, PlusCircle, XCircle, Package } from "lucide-react";
import CustomSelect from "@/components/custom-select";

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
    const url = editingProductId
      ? `/api/products/${editingProductId}`
      : "/api/products";
    const method = editingProductId ? "PUT" : "POST";
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
      <div className="flex items-center gap-2">
        <Package size={24} className="text-green-700" />
        <h1 className="text-xl font-bold">Products</h1>
      </div>

      <div className="bg-white border border-zinc-300 rounded-md p-4 space-y-4">
        <input
          placeholder="Product Name"
          className="border border-zinc-300 p-2 w-full rounded-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <CustomSelect<Category>
            value={category}
            options={[
              { label: "Inside Meals", value: "InsideMeals" },
              { label: "Outside Snacks", value: "OutsideSnacks" },
              { label: "Inside Beverages", value: "InsideBeverages" },
            ]}
            onChange={setCategory}
            className="flex-1"
          />
        </div>

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
          className="flex items-center gap-1 text-green-700 hover:underline"
          disabled={variants.length >= allVariantOptions.length}
          onClick={() => {
            const name = allVariantOptions.find(
              (opt) => !variants.some((v) => v.name === opt)
            )!;
            setVariants([
              ...variants,
              { name, price: 0, materials: [], ingredients: [] },
            ]);
          }}
        >
          <PlusCircle size={16} /> Add Variant
        </button>

        <div className="mt-4 flex gap-2">
          <button
            onClick={resetForm}
            className="bg-zinc-200 text-zinc-700 px-4 py-2 rounded-md hover:bg-zinc-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            {editingProductId ? "Update Product" : "Save Product"}
          </button>
        </div>
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
    <div className="border border-zinc-300 rounded-md p-4 bg-gray-50 space-y-4">
      <div className="flex items-center gap-2">
        <CustomSelect<VariantName>
          value={variant.name}
          options={allVariantOptions
            .filter(
              (opt) =>
                opt === variant.name || !variants.some((v) => v.name === opt)
            )
            .map((opt) => ({ label: opt, value: opt }))}
          onChange={(val) => update({ ...variant, name: val })}
          className="w-36"
        />

        <input
          type="number"
          className="border border-zinc-300 p-1 w-24 rounded-md"
          value={variant.price}
          onChange={(e) =>
            update({ ...variant, price: parseFloat(e.target.value) })
          }
        />
        <button
          onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
        >
          <XCircle size={20} className="text-red-600" />
        </button>
      </div>

      <NestedSelectors
        title="Materials"
        items={variant.materials}
        all={materials}
        onChange={(items) => update({ ...variant, materials: items })}
      />
      <NestedSelectors
        title="Ingredients"
        items={variant.ingredients}
        all={ingredients}
        onChange={(items) => update({ ...variant, ingredients: items })}
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
    <div className="space-y-2">
      <h3 className="font-medium">{title}</h3>
      <CustomSelect<string>
        value=""
        options={all
          .filter((x) => !items.some((it) => it.id === x.id))
          .map((x) => ({ label: x.name, value: x.id }))}
        onChange={(id) => onChange([...items, { id, quantity: 1 }])}
        placeholder={`+ Add ${title.slice(0, -1)}`}
        className="w-full"
      />

      {items.map((it, i) => {
        const found = all.find((x) => x.id === it.id);
        return (
          <div key={it.id} className="flex items-center gap-2">
            <span className="w-32 text-sm">{found?.name || "Unknown"}</span>
            <input
              type="number"
              className="border border-zinc-300 p-1 w-20 rounded-md"
              value={it.quantity}
              onChange={(e) => {
                const arr = [...items];
                arr[i].quantity = parseFloat(e.target.value);
                onChange(arr);
              }}
            />
            <button className="text-red-600">
              <XCircle size={16} />
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
    <table className="w-full mt-6 border border-zinc-300 text-sm bg-white rounded-md overflow-hidden">
      <thead>
        <tr className="text-left ">
          <th className="p-2 border border-zinc-300">Name</th>
          <th className="p-2 border border-zinc-300">Category</th>
          <th className="p-2 border border-zinc-300">Variants</th>
          <th className="p-2 border border-zinc-300">Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id} className="">
            <td className="p-2 border border-zinc-300">{p.name}</td>
            <td className="p-2 border border-zinc-300">{p.category}</td>
            <td className="p-2 border border-zinc-300">
              {p.variants.map((v, i) => (
                <div
                  key={v.id}
                  className={`${
                    i + 1 !== p.variants.length &&
                    "border-b pb-2 border-zinc-200"
                  } mb-2`}
                >
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
            <td className="p-2 border border-zinc-300 space-x-2">
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
