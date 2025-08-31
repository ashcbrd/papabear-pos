import { ReactNode } from "react";
import AdminCard from "./AdminCard";

interface AdminStatProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

interface AdminStatsProps {
  stats: AdminStatProps[];
}

export function AdminStat({
  title,
  value,
  icon,
  trend,
  description
}: AdminStatProps) {
  return (
    <AdminCard className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {value}
          </p>
          {description && (
            <p className="text-sm text-gray-500">
              {description}
            </p>
          )}
          {trend && (
            <div className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-2
              ${trend.isPositive 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-red-100 text-red-800'
              }
            `}>
              <svg className={`w-3 h-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-lg">
            {icon}
          </div>
        )}
      </div>
      <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-full blur-xl" />
    </AdminCard>
  );
}

export default function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <AdminStat key={index} {...stat} />
      ))}
    </div>
  );
}