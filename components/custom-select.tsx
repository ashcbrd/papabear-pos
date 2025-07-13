"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type CustomSelectProps<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
};

export default function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Select",
  className = "",
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <div className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="border border-zinc-300 p-2 w-full rounded-md text-left bg-white flex justify-between items-center gap-x-10"
      >
        {selectedLabel || placeholder}
        <ChevronDown />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full border rounded bg-white shadow-md max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`p-2 cursor-pointer hover:bg-gray-100 ${
                opt.value === value ? "bg-gray-100 font-semibold" : ""
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
