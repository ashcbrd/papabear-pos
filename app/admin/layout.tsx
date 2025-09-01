"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Soup,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  LogOut,
  Palette,
  DollarSign,
  Download,
  CheckCircle,
} from "lucide-react";
import { InitialDataImporter } from "@/lib/initial-data-import";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [showImportButton, setShowImportButton] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if import has been completed
    const isCompleted = InitialDataImporter.isImportCompleted();
    setShowImportButton(!isCompleted);
  }, []);

  const handleImport = async () => {
    setIsImporting(true);
    setImportStatus('importing');
    
    try {
      const result = await InitialDataImporter.importAllData();
      
      if (result.success) {
        setImportStatus('success');
        setShowImportButton(false); // Hide button permanently
        alert(`✅ Import Successful!\n\n` +
              `Imported:\n` +
              `• ${result.summary.flavors.imported}/${result.summary.flavors.total} flavors\n` +
              `• ${result.summary.products.imported}/${result.summary.products.total} products\n` +
              `• ${result.summary.materials.imported}/${result.summary.materials.total} materials\n` +
              `• ${result.summary.ingredients.imported}/${result.summary.ingredients.total} ingredients\n` +
              `• ${result.summary.addons.imported}/${result.summary.addons.total} addons\n\n` +
              `Your Papa Bear POS is ready to use!`);
      } else {
        setImportStatus('error');
        alert(`❌ Import Failed\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}`);
      }
    } catch (error) {
      setImportStatus('error');
      alert(`❌ Import Failed\n\nError: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/cashflow", label: "Cash Flow", icon: DollarSign },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/flavors", label: "Flavors", icon: Palette },
    { href: "/admin/materials", label: "Materials", icon: Boxes },
    { href: "/admin/ingredients", label: "Ingredients", icon: Soup },
    { href: "/admin/addons", label: "Addons", icon: UtensilsCrossed },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 shadow-xl fixed h-screen flex flex-col z-40">
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-600">
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
              <p className="text-emerald-100 text-sm font-medium">Admin Panel</p>
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
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
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
                        : "text-gray-500 group-hover:text-emerald-600"
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

        {/* One-Time Import Button */}
        {showImportButton && (
          <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-gray-900 mb-1">🚀 Initial Setup</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Import Papa Bear's menu items, flavors, and inventory to get started.
                This is a one-time setup for new installations.
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm
                transition-all duration-200 shadow-lg
                ${isImporting 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl'
                }
              `}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Importing Data...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Import Papa Bear Data
                </>
              )}
            </button>
            {isImporting && (
              <p className="text-xs text-blue-600 mt-2 text-center animate-pulse">
                This may take a few seconds...
              </p>
            )}
          </div>
        )}

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
