import { useState } from 'react';
import { Link2, Upload, Edit3 } from 'lucide-react';
import { ManualForm } from './ManualForm';
import { Coverage, InsuranceProvider } from '../../schemas/insurance';

interface ConnectMethodTabsProps {
  provider: InsuranceProvider;
  onSubmit: (coverage: Partial<Coverage>) => void;
  onCancel: () => void;
  darkMode?: boolean;
}

type ConnectionMethod = 'oauth' | 'upload' | 'manual';

export function ConnectMethodTabs({
  provider,
  onSubmit,
  onCancel,
  darkMode = false,
}: ConnectMethodTabsProps) {
  const [activeMethod, setActiveMethod] = useState<ConnectionMethod>('manual');

  const tabs: Array<{ method: ConnectionMethod; icon: typeof Link2; label: string }> = [
    { method: 'oauth', icon: Link2, label: 'Connect Account' },
    { method: 'upload', icon: Upload, label: 'Upload Card' },
    { method: 'manual', icon: Edit3, label: 'Enter Manually' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-surface-sunken dark:bg-surface-sunken rounded-lg">
        {tabs.map(({ method, icon: Icon, label }) => (
          <button
            key={method}
            onClick={() => setActiveMethod(method)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${
              activeMethod === method
                ? 'bg-white dark:bg-surface-sunken text-indigo-600 shadow-sm'
                : darkMode
                ? 'text-content-secondary hover:text-content-primary'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>

      <div>
        {activeMethod === 'oauth' && (
          <div className={`text-center py-12 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            <p className="mb-4">OAuth integration coming soon</p>
            <button
              onClick={() => setActiveMethod('manual')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Use manual entry instead
            </button>
          </div>
        )}

        {activeMethod === 'upload' && (
          <div className={`text-center py-12 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            <p className="mb-4">Card upload with OCR coming soon</p>
            <button
              onClick={() => setActiveMethod('manual')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Use manual entry instead
            </button>
          </div>
        )}

        {activeMethod === 'manual' && (
          <ManualForm
            providerId={provider.id}
            onSubmit={onSubmit}
            onCancel={onCancel}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
}
