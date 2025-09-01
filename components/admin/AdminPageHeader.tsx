import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({ 
  title, 
  icon, 
  description, 
  actions 
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
          </div>
        </div>
        {description && (
          <p className="text-gray-600 text-lg max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}