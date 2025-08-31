import { SelectHTMLAttributes, ReactNode } from "react";

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function AdminSelect({
  label,
  error,
  helperText,
  options,
  placeholder,
  icon,
  fullWidth = true,
  className = '',
  ...props
}: AdminSelectProps) {
  const selectClasses = `
    w-full px-4 py-3 
    border-2 rounded-xl 
    text-gray-900
    transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-offset-1
    bg-white
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/25' 
      : 'border-gray-200 focus:border-amber-500 focus:ring-amber-500/25 hover:border-gray-300'
    }
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
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        <select
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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