import { ReactNode } from 'react';

interface RecentActivityItemProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  time: string;
  iconBgColor?: string;
  iconColor?: string;
  darkMode?: boolean;
}

export function RecentActivityItem({
  icon,
  title,
  subtitle,
  time,
  iconBgColor = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
  darkMode = false
}: RecentActivityItemProps) {
  return (
    <div
      className={`hv-surface-card hv-surface-card--interactive flex cursor-pointer items-start gap-4 p-4 transition-all ${
        darkMode ? 'hover:bg-action-secondary hover:shadow-lg' : 'hover:bg-action-secondary hover:shadow-md hover:shadow-black/10'
      }`}
    >
      <div className={`flex items-center justify-center w-11 h-11 ${iconBgColor} ${iconColor} rounded-xl flex-shrink-0 transition-transform hover:scale-110`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold mb-1 ${
          darkMode ? 'text-white' : 'text-content-primary'
        }`}>{title}</h4>
        <p className={`text-sm leading-relaxed ${
          darkMode ? 'text-content-secondary' : 'text-content-secondary'
        }`}>{subtitle}</p>
        <p className={`text-xs mt-1.5 ${
          darkMode ? 'text-content-secondary' : 'text-content-secondary'
        }`}>{time}</p>
      </div>
    </div>
  );
}
