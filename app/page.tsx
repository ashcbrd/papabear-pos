"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, Settings, ChevronRight, Star } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-green-50/20">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/papabear.jpg" alt="Bear Icon" className="w-10 h-10" />

              <div>
                <h1 className="text-xl font-bold text-neutral-900">
                  Papa Bear Café
                </h1>
                <p className="text-sm text-neutral-600">Point of Sale System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">
                System Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 mr-2" />
                  Point of Sale Solution
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Papa Bear
                  </span>
                  <br />
                  <span className="text-neutral-900">Café POS</span>
                </h1>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => router.push("/pos")}
                  className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    <ShoppingCart className="w-6 h-6" />
                    <span>Start POS Terminal</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>

                <button
                  onClick={() => router.push("/admin/dashboard")}
                  className="group bg-white border-2 border-neutral-200 text-neutral-700 p-8 rounded-2xl font-semibold text-lg hover:border-neutral-300 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Settings className="w-6 h-6" />
                    <span>Admin Dashboard</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                {/* Main Image Container */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-neutral-200">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <Image
                      src="/papabear.jpg"
                      alt="Papa Bear Café Logo"
                      width={300}
                      height={300}
                      className="object-contain rounded-2xl"
                    />
                  </div>
                </div>

                {/* Background Decorations */}
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full opacity-60 blur-2xl"></div>
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-br from-emerald-200 to-green-200 rounded-full opacity-60 blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
