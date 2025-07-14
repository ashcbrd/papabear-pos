"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import { Receipt } from "lucide-react";

type Receipt = {
  id: string;
  createdAt: string;
  order: {
    total: number;
    paid: number;
    change: number;
    items: {
      product: { name: string };
      variant: { name: string; price: number };
      quantity: number;
      addons: {
        addon: { name: string; price: number };
        quantity: number;
      }[];
    }[];
  };
};

export default function AdminReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const receiptRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetch("/api/receipts")
      .then((res) => res.json())
      .then(setReceipts);
  }, []);

  const handleDownload = async (receiptId: string) => {
    const node = receiptRefs.current[receiptId];
    if (!node) return;

    const downloadBtn = node.querySelector(".no-print") as HTMLElement;
    if (downloadBtn) downloadBtn.style.visibility = "hidden";

    try {
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.download = `receipt-${receiptId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      if (downloadBtn) downloadBtn.style.visibility = "visible";
    }
  };

  return (
    <div className="p-6 space-y-6  mx-auto">
      <div className="flex items-center gap-2">
        <Receipt size={24} className="text-green-700" />
        <h1 className="text-xl font-bold">Receipts</h1>
      </div>

      <div className="flex flex-wrap gap-4 justify-start items-start">
        {receipts.map((receipt) => (
          <div
            key={receipt.id}
            ref={(el) => {
              receiptRefs.current[receipt.id] = el;
            }}
            className="bg-white text-black p-6 border border-zinc-300 shadow rounded font-mono text-sm w-[320px] h-max"
          >
            {/* Logo and timestamp */}
            <div className="flex justify-between items-center mb-2">
              <img
                src="/papabear.jpg"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
              <div className="text-xs text-zinc-600">
                {new Date(receipt.createdAt).toLocaleString()}
              </div>
            </div>

            <h2 className="text-center font-semibold text-base mb-2 tracking-wide">
              Papa Bear Café
            </h2>

            <div className="text-xs text-zinc-600 mb-4 text-center">
              Receipt ID: <span className="font-semibold">{receipt.id}</span>
            </div>

            <div className="space-y-2 border-t border-zinc-300 pt-2">
              {receipt.order.items.map((item, idx) => {
                const variantTotal = item.variant.price * item.quantity;

                return (
                  <div key={idx} className="pb-1 border-b border-dashed">
                    <div className="flex justify-between">
                      <span>
                        {item.product.name} - {item.variant.name} ×{" "}
                        {item.quantity}
                      </span>
                      <span>₱{variantTotal.toFixed(2)}</span>
                    </div>

                    {item.addons.length > 0 && (
                      <ul className="ml-4 mt-1 list-disc text-xs text-zinc-700 space-y-1">
                        {item.addons.map((a, i) => {
                          const addonTotal = a.addon.price * a.quantity;
                          return (
                            <li key={i} className="flex justify-between">
                              <span>
                                {a.addon.name} × {a.quantity}
                              </span>
                              <span>₱{addonTotal.toFixed(2)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-zinc-300 pt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold">
                  ₱{receipt.order.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Paid:</span>
                <span>₱{receipt.order.paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span>₱{receipt.order.change.toFixed(2)}</span>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={() => handleDownload(receipt.id)}
              className="no-print mt-4 w-full  text-black border border-zinc-300 rounded-md py-2 hover:bg-zinc-100 text-center text-sm  transition"
            >
              Download as Image
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
