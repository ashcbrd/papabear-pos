// app/admin/layout.tsx

import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>

        <nav className="p-4 space-y-2 text-sm">
          <Link
            href="/admin/dashboard"
            className="block text-gray-700 hover:text-blue-600"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="block text-gray-700 hover:text-blue-600"
          >
            Products
          </Link>
          <Link
            href="/admin/materials"
            className="block text-gray-700 hover:text-blue-600"
          >
            Materials
          </Link>
          <Link
            href="/admin/ingredients"
            className="block text-gray-700 hover:text-blue-600"
          >
            Ingredients
          </Link>
          <Link
            href="/admin/addons"
            className="block text-gray-700 hover:text-blue-600"
          >
            Addons
          </Link>
          <Link
            href="/admin/orders"
            className="block text-gray-700 hover:text-blue-600"
          >
            Orders
          </Link>
          <Link
            href="/admin/receipts"
            className="block text-gray-700 hover:text-blue-600"
          >
            Receipts
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
