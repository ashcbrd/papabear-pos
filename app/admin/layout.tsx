"use client";

import Link from "next/link";
import Image from "next/image";
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
  Settings,
  LogOut,
  Palette,
  DollarSign,
} from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/cashflow", label: "Cash Flow", icon: DollarSign },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/flavors", label: "Flavors", icon: Palette },
    { href: "/admin/materials", label: "Materials", icon: Boxes },
    { href: "/admin/ingredients", label: "Ingredients", icon: Soup },
    { href: "/admin/addons", label: "Addons", icon: UtensilsCrossed },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/receipts", label: "Receipts", icon: Receipt },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 shadow-xl fixed h-screen flex flex-col z-40">
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Image
                src="/papabear.jpg"
                alt="Papa Bear"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Papa Bear
              </h1>
              <p className="text-amber-100 text-sm font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25"
                      : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`
                    ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-amber-600"
                    }
                    transition-colors duration-200
                  `}
                />
                <span className="font-semibold text-sm">{label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100">
          <div className="space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-all duration-200 w-full group"
            >
              <LogOut
                size={20}
                className="text-gray-500 group-hover:text-red-600 transition-colors duration-200"
              />
              <span className="font-semibold text-sm">Back to POS</span>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              © {new Date().getFullYear()} Papa Bear Café
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-72">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          <div className="p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
