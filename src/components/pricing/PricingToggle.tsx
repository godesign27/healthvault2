import { track } from '../../lib/analytics';

interface PricingToggleProps {
  activeTab: 'individual' | 'business';
  onTabChange: (tab: 'individual' | 'business') => void;
  darkMode?: boolean;
}

export function PricingToggle({ activeTab, onTabChange, darkMode = false }: PricingToggleProps) {
  const handleTabChange = (tab: 'individual' | 'business') => {
    onTabChange(tab);
    track('pricing_tab_toggle', { tab });
  };

  return (
    <div
      role="tablist"
      aria-label="Pricing options"
      className={`inline-flex rounded-xl p-1 ${
        darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
      }`}
    >
      <button
        role="tab"
        aria-selected={activeTab === 'individual'}
        aria-controls="individual-panel"
        id="individual-tab"
        onClick={() => handleTabChange('individual')}
        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          activeTab === 'individual'
            ? darkMode
              ? 'bg-white text-content-primary shadow-sm focus-visible:outline-white'
              : 'bg-white text-content-primary shadow-sm focus-visible:outline-stroke-strong'
            : darkMode
            ? 'text-content-secondary hover:text-content-primary focus-visible:outline-stroke-default'
            : 'text-content-secondary hover:text-content-primary focus-visible:outline-stroke-strong'
        }`}
      >
        Individual
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'business'}
        aria-controls="business-panel"
        id="business-tab"
        onClick={() => handleTabChange('business')}
        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          activeTab === 'business'
            ? darkMode
              ? 'bg-white text-content-primary shadow-sm focus-visible:outline-white'
              : 'bg-white text-content-primary shadow-sm focus-visible:outline-stroke-strong'
            : darkMode
            ? 'text-content-secondary hover:text-content-primary focus-visible:outline-stroke-default'
            : 'text-content-secondary hover:text-content-primary focus-visible:outline-stroke-strong'
        }`}
      >
        Business / Provider
      </button>
    </div>
  );
}
