"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Soup,
  UtensilsCrossed,
  ClipboardList,
  Receipt,
} from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/materials", label: "Materials", icon: Boxes },
    { href: "/admin/ingredients", label: "Ingredients", icon: Soup },
    { href: "/admin/addons", label: "Addons", icon: UtensilsCrossed },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/receipts", label: "Receipts", icon: Receipt },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-300 shadow-sm fixed h-screen flex flex-col">
        <div className="p-4 border-b border-zinc-300 flex items-center gap-2">
          <img src="/papabear.jpg" alt="Papa Bear" className="h-8" />
          <h1 className="text-xl font-bold tracking-tight text-gray-800">
            Papa Bear Admin
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 text-sm">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-zinc-100 text-zinc-700"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <footer className="p-4 text-xs text-zinc-300 border-t">
          © {new Date().getFullYear()} Papa Bear Café
        </footer>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-6 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}
