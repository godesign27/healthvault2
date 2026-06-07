import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { VerificationStatus } from '../../schemas/insurance';

interface StatusBadgeProps {
  status: VerificationStatus;
  darkMode?: boolean;
}

export function StatusBadge({ status, darkMode = false }: StatusBadgeProps) {
  const configs = {
    connected: {
      icon: CheckCircle2,
      label: 'Connected',
      bgClass: 'bg-emerald-600',
      textClass: 'text-white',
    },
    verified: {
      icon: CheckCircle2,
      label: 'Verified',
      bgClass: 'bg-emerald-600',
      textClass: 'text-white',
    },
    verifying: {
      icon: Clock,
      label: 'Verifying',
      bgClass: darkMode ? 'bg-blue-600' : 'bg-blue-500',
      textClass: 'text-white',
    },
    needs_attention: {
      icon: AlertCircle,
      label: 'Needs Attention',
      bgClass: 'bg-amber-500',
      textClass: 'text-white',
    },
    expiring: {
      icon: Calendar,
      label: 'Expiring Soon',
      bgClass: 'bg-orange-500',
      textClass: 'text-white',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${config.bgClass} ${config.textClass}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}
