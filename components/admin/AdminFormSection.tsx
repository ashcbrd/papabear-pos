import { ReactNode } from "react";
import AdminCard from "./AdminCard";

interface AdminFormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function AdminFormSection({
  title,
  description,
  children,
  className = ''
}: AdminFormSectionProps) {
  return (
    <AdminCard className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div className="border-b border-gray-100 pb-4">
          {title && (
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </AdminCard>
  );
}