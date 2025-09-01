import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

interface AdminSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  value?: string | number;
  onChange?: (e: { target: { value: string | number } }) => void;
  disabled?: boolean;
  className?: string;
}

export default function AdminSelect({
  label,
  error,
  helperText,
  options,
  placeholder = "Select an option",
  icon,
  fullWidth = true,
  value,
  onChange,
  disabled = false,
  className = '',
  ...props
}: AdminSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange?.({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const buttonClasses = `
    w-full px-4 py-3 
    border-2 rounded-xl 
    text-gray-900
    transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-offset-1
    bg-white cursor-pointer
    flex items-center justify-between
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/25' 
      : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/25 hover:border-gray-300'
    }
    ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}
    ${icon ? 'pl-12' : ''}
    ${className}
  `;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-20">
            {icon}
          </div>
        )}
        
        <button
          type="button"
          className={buttonClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          {...props}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Custom Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute z-30 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
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
                      w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors duration-150
                      flex items-center justify-between group
                      ${value === option.value ? 'bg-emerald-50 text-emerald-900' : 'text-gray-900'}
                    `}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className="font-medium">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}