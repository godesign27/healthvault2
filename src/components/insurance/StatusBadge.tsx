import { Info } from 'lucide-react';
import { insuranceStatus } from '../../../packages/api-client/src/insurance-status';
interface StatusBadgeProps { status: string; darkMode?: boolean; }
export function StatusBadge({ status, darkMode: _darkMode = false }: StatusBadgeProps) {
  const {label,tone} = insuranceStatus(status);
  return <span data-hv-semantic className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{backgroundColor:`var(--hv-color-surface-feedback-${tone})`,color:`var(--hv-color-text-feedback-${tone})`}}>
    <Info className="w-4 h-4 shrink-0" aria-hidden="true" />{label}
  </span>;
}
