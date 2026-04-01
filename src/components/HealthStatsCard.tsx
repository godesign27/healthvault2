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
        ? 'border-stone-800 bg-gradient-to-br from-stone-900/50 to-stone-900/30 hover:border-stone-700'
        : 'border-stone-200 bg-gradient-to-br from-white to-stone-50/50 hover:border-stone-300 hover:shadow-stone-200/50'
    }`}>
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex items-center justify-center w-12 h-12 ${iconBgColor} ${iconColor} rounded-xl transition-transform group-hover:scale-110`}>
            {icon}
          </div>
        </div>
        <div className="mt-auto">
          <h3 className={`text-sm font-medium mb-2 ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>{title}</h3>
          <p className={`text-4xl font-bold mb-1 tracking-tight ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>{value}</p>
          <p className={`text-sm ${
            darkMode ? 'text-stone-500' : 'text-stone-500'
          }`}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
