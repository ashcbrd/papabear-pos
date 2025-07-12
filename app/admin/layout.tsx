"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/materials", label: "Materials" },
    { href: "/admin/ingredients", label: "Ingredients" },
    { href: "/admin/addons", label: "Addons" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/receipts", label: "Receipts" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r shadow-sm fixed h-screen">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>

        <nav className="p-4 space-y-2 text-sm">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`block px-2 py-1 rounded ${
                  isActive
                    ? "text-blue-600 font-medium bg-blue-50"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6 ml-64">{children}</main>
    </div>
  );
}
