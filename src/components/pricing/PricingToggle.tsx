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
        darkMode ? 'bg-stone-800' : 'bg-stone-100'
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
              ? 'bg-white text-stone-900 shadow-sm focus-visible:outline-white'
              : 'bg-white text-stone-900 shadow-sm focus-visible:outline-stone-900'
            : darkMode
            ? 'text-stone-400 hover:text-stone-300 focus-visible:outline-stone-400'
            : 'text-stone-600 hover:text-stone-900 focus-visible:outline-stone-600'
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
              ? 'bg-white text-stone-900 shadow-sm focus-visible:outline-white'
              : 'bg-white text-stone-900 shadow-sm focus-visible:outline-stone-900'
            : darkMode
            ? 'text-stone-400 hover:text-stone-300 focus-visible:outline-stone-400'
            : 'text-stone-600 hover:text-stone-900 focus-visible:outline-stone-600'
        }`}
      >
        Business / Provider
      </button>
    </div>
  );
}
