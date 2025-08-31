import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#fefefe] to-[#f3f3f3] flex items-center justify-center z-50">
      <div className="text-center space-y-8">
        <div className="w-full flex justify-center">
          <Image
            src="/papabear.jpg"
            alt="Papa Bear Logo"
            width={120}
            height={120}
            className="object-contain animate-pulse"
          />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-800">
            Papa Bear Cafe
          </h1>
          <p className="text-lg text-zinc-600">
            Point of Sale System
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        <p className="text-sm text-zinc-500">
          Initializing database...
        </p>
      </div>
    </div>
  );
}