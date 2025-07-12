"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { X, Download, Printer } from "lucide-react";

type OrderConfirmationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function OrderConfirmationDialog({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}: OrderConfirmationDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    const canvas = await html2canvas(receiptRef.current);
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "receipt.png";
    link.click();
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(
        "<html><head><title>Receipt</title></head><body>"
      );
      printWindow.document.write(receiptRef.current.innerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className={`bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative ${className}`}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Title */}
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}

        {/* Receipt Content */}
        <div ref={receiptRef} className="space-y-2 text-sm">
          {children}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            <Printer size={16} /> Print
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              <Download size={16} /> Download Receipt
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
