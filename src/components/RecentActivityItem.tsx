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
    <div className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer ${
      darkMode
        ? 'hover:bg-stone-800/50 hover:shadow-lg'
        : 'hover:bg-white hover:shadow-md hover:shadow-stone-200/50'
    }`}>
      <div className={`flex items-center justify-center w-11 h-11 ${iconBgColor} ${iconColor} rounded-xl flex-shrink-0 transition-transform hover:scale-110`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold mb-1 ${
          darkMode ? 'text-white' : 'text-stone-900'
        }`}>{title}</h4>
        <p className={`text-sm leading-relaxed ${
          darkMode ? 'text-stone-400' : 'text-stone-600'
        }`}>{subtitle}</p>
        <p className={`text-xs mt-1.5 ${
          darkMode ? 'text-stone-500' : 'text-stone-500'
        }`}>{time}</p>
      </div>
    </div>
  );
}
