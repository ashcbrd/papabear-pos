import { ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export default function AdminCard({ 
  children, 
  className = "", 
  padding = 'md' 
}: AdminCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`
      bg-white 
      border border-gray-200 
      rounded-xl 
      shadow-sm 
      hover:shadow-md 
      transition-shadow 
      duration-200 
      ${paddingClasses[padding]} 
      ${className}
    `}>
      {children}
    </div>
  );
}