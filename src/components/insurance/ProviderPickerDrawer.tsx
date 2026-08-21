import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { InsuranceProvider } from '../../schemas/insurance';
import { supabase } from '../../lib/supabase';

interface ProviderPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: InsuranceProvider) => void;
  darkMode?: boolean;
}

export function ProviderPickerDrawer({
  isOpen,
  onClose,
  onSelectProvider,
  darkMode = false,
}: ProviderPickerDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadProviders();
    }
  }, [isOpen]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('*')
        .order('is_popular', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;

      const mappedProviders: InsuranceProvider[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        payerId: p.payer_id,
        logoUrl: p.logo_url,
        slug: p.slug,
        isPopular: p.is_popular,
        createdAt: p.created_at,
      }));

      setProviders(mappedProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = searchQuery
    ? providers.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : providers;

  const popularProviders = filteredProviders.filter(p => p.isPopular);
  const otherProviders = filteredProviders.filter(p => !p.isPopular);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className={`relative w-full max-w-[480px] h-[80vh] rounded-xl shadow-xl flex flex-col ${
        darkMode ? 'bg-surface-raised' : 'bg-white'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
        }`}>
          <h2 className={`text-xl font-semibold ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            Select Insurance Provider
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-surface-sunken' : 'hover:bg-surface-sunken'
            }`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`} />
          </button>
        </div>

        <div className="p-6">
          <div className={`relative ${darkMode ? 'text-content-primary' : 'text-content-primary'}`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`} />
            <input
              type="text"
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                darkMode
                  ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder'
                  : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder'
              }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {popularProviders.length > 0 && (
                <div className="mb-8">
                  <h3 className={`text-sm font-medium mb-4 ${
                    darkMode ? 'text-content-secondary' : 'text-content-secondary'
                  }`}>
                    Popular Providers
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {popularProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => onSelectProvider(provider)}
                        className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                          darkMode
                            ? 'border-stroke-default hover:bg-surface-sunken hover:border-indigo-600'
                            : 'border-stroke-subtle hover:bg-surface-sunken hover:border-indigo-600'
                        }`}
                      >
                        {provider.logoUrl && (
                          <img
                            src={provider.logoUrl}
                            alt={provider.name}
                            className="w-10 h-10 rounded-lg"
                          />
                        )}
                        <span className={`text-sm font-medium text-left ${
                          darkMode ? 'text-white' : 'text-content-primary'
                        }`}>
                          {provider.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {otherProviders.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium mb-4 ${
                    darkMode ? 'text-content-secondary' : 'text-content-secondary'
                  }`}>
                    All Providers
                  </h3>
                  <div className="space-y-2">
                    {otherProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => onSelectProvider(provider)}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                          darkMode
                            ? 'border-stroke-default hover:bg-surface-sunken'
                            : 'border-stroke-subtle hover:bg-surface-sunken'
                        }`}
                      >
                        {provider.logoUrl && (
                          <img
                            src={provider.logoUrl}
                            alt={provider.name}
                            className="w-10 h-10 rounded-lg"
                          />
                        )}
                        <span className={`font-medium ${
                          darkMode ? 'text-white' : 'text-content-primary'
                        }`}>
                          {provider.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredProviders.length === 0 && !loading && (
                <div className={`text-center py-12 ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                  <p>No providers found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
