"use client";

import { useEffect, useRef, useState } from "react";
import domToImage from "dom-to-image-more";

type Receipt = {
  id: string;
  createdAt: string;
  order: {
    total: number;
    paid: number;
    change: number;
    items: {
      product: { name: string };
      variant: { name: string };
      quantity: number;
      addons: {
        addon: { name: string };
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

    try {
      const dataUrl = await domToImage.toPng(node);
      const link = document.createElement("a");
      link.download = `receipt-${receiptId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Receipts</h1>

      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="border p-4 rounded space-y-2 bg-white shadow-sm text-sm"
          ref={(el) => {
            receiptRefs.current[receipt.id] = el;
          }}
        >
          <div className="flex justify-between text-gray-600">
            <div>
              <span className="font-medium">Receipt ID:</span> {receipt.id}
            </div>
            <div>{new Date(receipt.createdAt).toLocaleString()}</div>
          </div>

          <div className="text-sm text-gray-600">
            <span className="font-medium">Order ID:</span> {receipt.id}
          </div>

          <div className="mt-2 space-y-1">
            {receipt.order.items.map((item, idx) => (
              <div key={idx} className="border-b pb-1">
                {item.product.name} – {item.variant.name} × {item.quantity}
                {item.addons.length > 0 && (
                  <ul className="ml-4 list-disc text-xs text-gray-700">
                    {item.addons.map((a, i) => (
                      <li key={i}>
                        {a.addon.name} × {a.quantity}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* ✅ Download button placed back here */}
          <button
            onClick={() => handleDownload(receipt.id)}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded"
          >
            Download as Image
          </button>

          <div className="pt-2 border-t text-gray-700">
            <div>Total: ₱{receipt.order.total.toFixed(2)}</div>
            <div>Paid: ₱{receipt.order.paid.toFixed(2)}</div>
            <div>Change: ₱{receipt.order.change.toFixed(2)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
