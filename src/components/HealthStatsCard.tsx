import { ReactNode } from 'react';
import { Card } from './ui/Card';

interface HealthStatsCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function HealthStatsCard({
  icon,
  title,
  value,
  subtitle,
  iconBgColor = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
}: HealthStatsCardProps) {
  return (
    <Card shadow="blur" className="group h-full">
      <div className="flex h-full flex-col p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className={`flex items-center justify-center w-12 h-12 ${iconBgColor} ${iconColor} rounded-xl transition-transform group-hover:scale-110`}>
            {icon}
          </div>
        </div>
        <div className="mt-auto">
          <h3 className="mb-2 text-sm font-medium text-content-secondary">{title}</h3>
          <p className="mb-1 text-4xl font-bold tracking-tight text-content-primary">{value}</p>
          <p className="text-sm text-content-secondary">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}
