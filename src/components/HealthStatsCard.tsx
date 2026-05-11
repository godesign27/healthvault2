import { ReactNode } from 'react';

interface HealthStatsCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  iconBgColor?: string;
  iconColor?: string;
  darkMode?: boolean;
}

export function HealthStatsCard({
  icon,
  title,
  value,
  subtitle,
  iconBgColor = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
  darkMode = false
}: HealthStatsCardProps) {
  return (
    <div className={`h-full rounded-xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg group ${
      darkMode
        ? 'border-stroke-subtle bg-gradient-to-br from-surface-raised/50 to-surface-raised/30 hover:border-stroke-default'
        : 'border-stroke-subtle bg-gradient-to-br from-surface-raised to-surface-sunken/50 hover:border-stroke-default hover:shadow-black/10'
    }`}>
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex items-center justify-center w-12 h-12 ${iconBgColor} ${iconColor} rounded-xl transition-transform group-hover:scale-110`}>
            {icon}
          </div>
        </div>
        <div className="mt-auto">
          <h3 className={`text-sm font-medium mb-2 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>{title}</h3>
          <p className={`text-4xl font-bold mb-1 tracking-tight ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>{value}</p>
          <p className={`text-sm ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
