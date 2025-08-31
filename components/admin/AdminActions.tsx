import { ReactNode } from "react";

interface AdminActionsProps {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export default function AdminActions({
  children,
  align = 'right',
  className = ''
}: AdminActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <div className={`
      flex items-center gap-3 pt-6 border-t border-gray-100
      ${alignClasses[align]}
      ${className}
    `}>
      {children}
    </div>
  );
}