import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(({
  label,
  error,
  helperText,
  icon,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const inputClasses = `
    w-full px-4 py-3 
    border-2 rounded-xl 
    text-gray-900 placeholder-gray-500
    transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-offset-1
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
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
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
});

AdminInput.displayName = 'AdminInput';

export default AdminInput;