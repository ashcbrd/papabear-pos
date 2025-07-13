"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#fefefe] to-[#f3f3f3]">
      <div className="text-center space-y-10 max-w-md">
        <h1 className="text-4xl font-bold tracking-wide text-zinc-800">
          Papa Bear Cafe
          <br />
          <span className="text-2xl font-medium text-zinc-600">
            Point of Sale System
          </span>
        </h1>

        <div className="w-full flex justify-center">
          <Image
            src="/papabear.jpg" // Replace with your actual image path in public folder
            alt="Papa Bear Logo"
            width={180}
            height={180}
            className="object-contain"
          />
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="w-full py-4 text-lg font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition"
          >
            Admin Panel
          </button>
          <button
            onClick={() => router.push("/pos")}
            className="w-full py-4 text-lg font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            POS Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
