"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

type CustomSelectProps<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Select",
  className = "",
  disabled = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-max min-w-[200px] ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          px-4 py-3 w-full rounded-xl text-left 
          border-2 transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-offset-1
          flex justify-between items-center gap-4
          ${disabled 
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-white border-gray-200 hover:border-gray-300 focus:border-amber-500 focus:ring-amber-500/25'
          }
        `}
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-30 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          <div className="py-2">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`
                    w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors duration-150
                    flex items-center justify-between group
                    ${value === option.value ? 'bg-amber-50 text-amber-900' : 'text-gray-900'}
                  `}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="font-medium">{option.label}</span>
                  {value === option.value && (
                    <Check className="w-4 h-4 text-amber-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}