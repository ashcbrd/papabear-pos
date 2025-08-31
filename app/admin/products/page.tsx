"use client";

import { useEffect, useState } from "react";
import { Category, Ingredient, Material } from "@prisma/client";
import { Pencil, Trash, PlusCircle, XCircle, Package, Plus } from "lucide-react";
import CustomSelect from "@/components/custom-select";
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

type FlavorName = "Original" | "Chocolate" | "Vanilla" | "Strawberry" | "Caramel" | "Matcha" | "Hazelnut" | "Mocha" | "Irish Cream" | "Taro" | "Honeydew" | "Mango" | "Coconut";
const allFlavorOptions: FlavorName[] = [
  "Original",
  "Chocolate", 
  "Vanilla",
  "Strawberry",
  "Caramel",
  "Matcha",
  "Hazelnut",
  "Mocha", 
  "Irish Cream",
  "Taro",
  "Honeydew",
  "Mango",
  "Coconut",
];

type SizeName = "Medium" | "Large";
const allSizeOptions: SizeName[] = [
  "Medium",
  "Large",
];

interface FlavorInput {
  name: FlavorName;
}

interface SizeInput {
  name: SizeName;
  price: number;
  materials: { id: string; quantity: number }[];
  ingredients: { id: string; quantity: number }[];
}

interface Product {
  id: string;
  name: string;
  category: Category;
  imageUrl: string | null;
  flavors: {
    id: string;
    name: FlavorName;
  }[];
  sizes: {
    id: string;
    name: SizeName;
    price: number;
    materials: { material: Material; quantityUsed: number }[];
    ingredients: { ingredient: Ingredient; quantityUsed: number }[];
  }[];
}

export default function ProductsAdminPage() {
  const { products, materials, ingredients, createProduct, updateProduct, deleteProduct } = useData();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("InsideMeals");
  const [flavors, setFlavors] = useState<FlavorInput[]>([
    { name: "Original" },
  ]);
  const [sizes, setSizes] = useState<SizeInput[]>([
    { name: "Medium", price: 0, materials: [], ingredients: [] },
  ]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingProductId(null);
    setName("");
    setCategory("InsideMeals");
    setFlavors([{ name: "Original" }]);
    setSizes([{ name: "Medium", price: 0, materials: [], ingredients: [] }]);
  };

  const handleSave = async () => {
    try {
      const payload = { name, category, flavors, sizes };
      if (editingProductId) {
        await updateProduct(editingProductId, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed");
    }
  };

  const startEdit = (p: Product) => {
    setEditingProductId(p.id);
    setName(p.name);
    setCategory(p.category);
    setFlavors(
      p.flavors.map((f) => ({
        name: f.name,
      }))
    );
    setSizes(
      p.sizes.map((s) => ({
        name: s.name,
        price: s.price,
        materials: s.materials.map((m) => ({
          id: m.material.id,
          quantity: m.quantityUsed,
        })),
        ingredients: s.ingredients.map((i) => ({
          id: i.ingredient.id,
          quantity: i.quantityUsed,
        })),
      }))
    );
  };

  // Prepare table columns
  const tableColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row: any) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
          {row.category.replace(/([a-z])([A-Z])/g, '$1 $2')}
        </span>
      )
    },
    {
      header: 'Flavors',
      accessor: 'flavors',
      cell: (row: any) => (
        <div className="space-y-1">
          {row.flavors?.map((f: any, i: number) => (
            <div key={i} className="text-sm">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {f.name}
              </span>
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Sizes',
      accessor: 'sizes',
      cell: (row: any) => (
        <div className="space-y-2">
          {row.sizes?.map((s: any, i: number) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{s.name}</span> - ₱{s.price?.toFixed(2)}
            </div>
          ))}
        </div>
      )
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
        title="Products"
        icon={<Package size={24} />}
        description="Manage your restaurant's products, variants, and pricing"
      />

      <AdminFormSection
        title="Create New Product"
        description="Add a new product with flavors, sizes, materials, and ingredients"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInput
            label="Product Name"
            placeholder="Enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <AdminSelect
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            options={[
              { label: "Inside Meals", value: "InsideMeals" },
              { label: "Outside Snacks", value: "OutsideSnacks" },
              { label: "Inside Beverages", value: "InsideBeverages" },
            ]}
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Product Flavors</h4>
              <AdminButton
                size="sm"
                variant="outline"
                icon={<Plus size={16} />}
                disabled={flavors.length >= allFlavorOptions.length}
                onClick={() => {
                  const name = allFlavorOptions.find(
                    (opt) => !flavors.some((f) => f.name === opt)
                  )!;
                  setFlavors([...flavors, { name }]);
                }}
              >
                Add Flavor
              </AdminButton>
            </div>

            {flavors.map((flavor, idx) => (
              <FlavorEditor
                key={idx}
                idx={idx}
                flavor={flavor}
                flavors={flavors}
                setFlavors={setFlavors}
              />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Product Sizes</h4>
              <AdminButton
                size="sm"
                variant="outline"
                icon={<Plus size={16} />}
                disabled={sizes.length >= allSizeOptions.length}
                onClick={() => {
                  const name = allSizeOptions.find(
                    (opt) => !sizes.some((s) => s.name === opt)
                  )!;
                  setSizes([
                    ...sizes,
                    { name, price: 0, materials: [], ingredients: [] },
                  ]);
                }}
              >
                Add Size
              </AdminButton>
            </div>

            {sizes.map((size, idx) => (
              <SizeEditor
                key={idx}
                idx={idx}
                size={size}
                sizes={sizes}
                setSizes={setSizes}
                materials={materials}
                ingredients={ingredients}
              />
            ))}
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
          >
            {editingProductId ? "Update Product" : "Create Product"}
          </AdminButton>
        </AdminActions>
      </AdminFormSection>

      <AdminCard>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Products</h3>
          <p className="text-gray-600">Manage and edit your existing products</p>
        </div>
        <AdminTable
          columns={tableColumns}
          data={products}
          emptyMessage="No products found. Create your first product above."
        />
      </AdminCard>
    </div>
  );
}

function FlavorEditor({
  idx,
  flavor,
  flavors,
  setFlavors,
}: {
  idx: number;
  flavor: FlavorInput;
  flavors: FlavorInput[];
  setFlavors: React.Dispatch<React.SetStateAction<FlavorInput[]>>;
}) {
  const update = (f: FlavorInput) =>
    setFlavors(flavors.map((x, i) => (i === idx ? f : x)));

  return (
    <AdminCard className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
      <div className="flex items-center gap-4 mb-2">
        <AdminSelect
          label="Flavor"
          value={flavor.name}
          onChange={(e) => update({ ...flavor, name: e.target.value as FlavorName })}
          options={allFlavorOptions
            .filter(
              (opt) =>
                opt === flavor.name || !flavors.some((f) => f.name === opt)
            )
            .map((opt) => ({ label: opt, value: opt }))}
          fullWidth={false}
          className="w-40"
        />

        <div className="mt-6">
          <AdminButton
            size="sm"
            variant="danger"
            icon={<XCircle size={16} />}
            onClick={() => setFlavors(flavors.filter((_, i) => i !== idx))}
          >
            Remove
          </AdminButton>
        </div>
      </div>
    </AdminCard>
  );
}

function SizeEditor({
  idx,
  size,
  sizes,
  setSizes,
  materials,
  ingredients,
}: {
  idx: number;
  size: SizeInput;
  sizes: SizeInput[];
  setSizes: React.Dispatch<React.SetStateAction<SizeInput[]>>;
  materials: Material[];
  ingredients: Ingredient[];
}) {
  const update = (s: SizeInput) =>
    setSizes(sizes.map((x, i) => (i === idx ? s : x)));

  return (
    <AdminCard className="bg-gradient-to-br from-gray-50 to-white border-gray-200">
      <div className="flex items-center gap-4 mb-6">
        <AdminSelect
          label="Size"
          value={size.name}
          onChange={(e) => update({ ...size, name: e.target.value as SizeName })}
          options={allSizeOptions
            .filter(
              (opt) =>
                opt === size.name || !sizes.some((s) => s.name === opt)
            )
            .map((opt) => ({ label: opt, value: opt }))}
          fullWidth={false}
          className="w-40"
        />

        <AdminInput
          type="number"
          label="Price (₱)"
          value={size.price}
          onChange={(e) =>
            update({ ...size, price: parseFloat(e.target.value) || 0 })
          }
          fullWidth={false}
          className="w-32"
        />

        <div className="mt-6">
          <AdminButton
            size="sm"
            variant="danger"
            icon={<XCircle size={16} />}
            onClick={() => setSizes(sizes.filter((_, i) => i !== idx))}
          >
            Remove
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NestedSelectors
          title="Materials"
          items={size.materials}
          all={materials}
          onChange={(items) => update({ ...size, materials: items })}
        />
        <NestedSelectors
          title="Ingredients"
          items={size.ingredients}
          all={ingredients}
          onChange={(items) => update({ ...size, ingredients: items })}
        />
      </div>
    </AdminCard>
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
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        <AdminSelect
          placeholder={`+ Add ${title.slice(0, -1)}`}
          value=""
          onChange={(e) => {
            if (e.target.value) {
              onChange([...items, { id: e.target.value, quantity: 1 }]);
            }
          }}
          options={all
            .filter((x) => !items.some((it) => it.id === x.id))
            .map((x) => ({ label: x.name, value: x.id }))}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => {
            const found = all.find((x) => x.id === it.id);
            return (
              <div key={it.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <span className="flex-1 text-sm font-medium text-gray-900">
                  {found?.name || "Unknown"}
                </span>
                <AdminInput
                  type="number"
                  value={it.quantity}
                  onChange={(e) => {
                    const arr = [...items];
                    arr[i].quantity = parseFloat(e.target.value) || 0;
                    onChange(arr);
                  }}
                  fullWidth={false}
                  className="w-20"
                />
                <AdminButton
                  size="sm"
                  variant="danger"
                  icon={<XCircle size={14} />}
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

