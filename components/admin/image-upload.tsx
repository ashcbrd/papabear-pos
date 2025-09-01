"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  className = "",
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64 for local storage/preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onChange(result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Product Image
        </label>
        <p className="text-xs text-gray-500">
          Upload a product image (JPG, PNG, max 5MB)
        </p>
      </div>

      {preview ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
            <img
              src={preview}
              alt="Product preview"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={handleClick}
                  className="bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  disabled={uploading}
                >
                  <Upload size={16} className="inline mr-1" />
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                  disabled={uploading}
                >
                  <X size={16} className="inline mr-1" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={`
            w-full h-48 border-2 border-dashed border-gray-300 rounded-lg 
            flex flex-col items-center justify-center space-y-2 
            transition-colors cursor-pointer
            ${!disabled && "hover:border-gray-400 hover:bg-gray-50"}
            ${disabled && "opacity-50 cursor-not-allowed"}
            ${uploading && "opacity-50 cursor-not-allowed"}
          `}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              <p className="text-sm text-gray-500">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon size={32} className="text-gray-400" />
              <p className="text-sm text-gray-500 font-medium">
                Click to upload image
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG up to 5MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}