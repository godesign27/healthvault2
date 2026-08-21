import { useState, useEffect, useRef } from 'react';
import { X, Search, User, Info } from 'lucide-react';
import { Provider, ProviderRelationship } from '../../types/network';
import { AddProviderInputZ, AddProviderInput } from '../../schemas/network';
import { searchInNetworkProviders, searchPublicProviders } from '../../lib/clinical-connectors';
import { useNetworkStore } from '../../lib/stores/network-store';
import { Toast } from '../Toast';

interface AddProviderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  specialistMode?: boolean;
}

export function AddProviderDrawer({ isOpen, onClose, darkMode = false, specialistMode = false }: AddProviderDrawerProps) {
  const { addProvider, insurance } = useNetworkStore();
  const [step, setStep] = useState<'mode' | 'search' | 'manual'>('mode');
  const [searchMode, setSearchMode] = useState<'network' | 'public'>('network');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [searching, setSearching] = useState(false);
  const [formData, setFormData] = useState<Partial<AddProviderInput>>({
    connectionSource: 'Manual',
    relationship: specialistMode ? 'Specialist' : 'Primary'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && specialistMode) {
      if (step === 'mode') {
        setStep('search');
        if (insurance.connected) {
          setSearchMode('network');
        } else {
          setSearchMode('public');
        }
      }

      if (step === 'search') {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  }, [isOpen, specialistMode, step, insurance.connected]);

  useEffect(() => {
    if (specialistMode) {
      setFormData(prev => ({
        ...prev,
        relationship: 'Specialist'
      }));
    }
  }, [specialistMode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = searchMode === 'network' && insurance.planId
        ? await searchInNetworkProviders(searchQuery, insurance.planId)
        : await searchPublicProviders(searchQuery);
      setSearchResults(results);
    } catch (error) {
      setToast({ message: 'Failed to search providers', type: 'error' });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (provider: Provider) => {
    setFormData({
      ...provider,
      relationship: specialistMode ? 'Specialist' : 'Primary',
      connectionSource: provider.connectionSource || 'Manual'
    });
    setStep('manual');
  };

  const handleSubmit = async () => {
    setErrors({});
    const validation = AddProviderInputZ.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      await addProvider({
        ...validation.data,
      });
      setToast({ message: 'Provider added successfully!', type: 'success' });
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setToast({ message: 'Failed to add provider', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep('mode');
    setSearchMode('network');
    setSearchQuery('');
    setSearchResults([]);
    setFormData({
      connectionSource: 'Manual',
      relationship: specialistMode ? 'Specialist' : 'Primary'
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-2xl z-50 ${'bg-surface-raised'} shadow-xl overflow-y-auto`}>
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${'bg-surface-raised border-stroke-subtle'}`}>
          <h2 className={`text-2xl font-bold ${'text-content-primary'}`}>
            {specialistMode ? 'Find Specialist' : 'Add Provider'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${'hover:bg-surface-sunken'}`}
          >
            <X className={`w-6 h-6 ${'text-content-secondary'}`} />
          </button>
        </div>

        {specialistMode && (
          <div className={`mx-6 mt-6 p-4 rounded-lg flex items-start gap-3 ${
            darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
          }`}>
            <Info className={`w-5 h-5 mt-0.5 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                Finding a Specialist
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Search for specialists like cardiologists, dermatologists, or any other specialized care provider. The relationship will be automatically set to "Specialist".
              </p>
            </div>
          </div>
        )}

        <div className="p-6">
          {step === 'mode' && (
            <div className="space-y-4">
              <p className={'text-content-secondary'}>
                How would you like to add this provider?
              </p>

              {insurance.connected ? (
                <>
                  <button
                    onClick={() => {
                      setSearchMode('network');
                      setStep('search');
                    }}
                    className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                      darkMode
                        ? 'border-stroke-default hover:border-blue-600 hover:bg-surface-sunken'
                        : 'border-stroke-subtle hover:border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <h3 className={`font-semibold mb-2 ${'text-content-primary'}`}>
                      Search In-Network Providers
                    </h3>
                    <p className={`text-sm ${'text-content-secondary'}`}>
                      Find providers covered by {insurance.name}
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setSearchMode('public');
                      setStep('search');
                    }}
                    className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                      darkMode
                        ? 'border-stroke-default hover:border-blue-600 hover:bg-surface-sunken'
                        : 'border-stroke-subtle hover:border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <h3 className={`font-semibold mb-2 ${'text-content-primary'}`}>
                      Search All Providers
                    </h3>
                    <p className={`text-sm ${'text-content-secondary'}`}>
                      Search the NPI registry
                    </p>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setSearchMode('public');
                    setStep('search');
                  }}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                    darkMode
                      ? 'border-stroke-default hover:border-blue-600 hover:bg-surface-sunken'
                      : 'border-stroke-subtle hover:border-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <h3 className={`font-semibold mb-2 ${'text-content-primary'}`}>
                    Search Providers
                  </h3>
                  <p className={`text-sm ${'text-content-secondary'}`}>
                    Search the NPI registry
                  </p>
                </button>
              )}

              <button
                onClick={() => setStep('manual')}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  darkMode
                    ? 'border-stroke-default hover:border-blue-600 hover:bg-surface-sunken'
                    : 'border-stroke-subtle hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                <h3 className={`font-semibold mb-2 ${'text-content-primary'}`}>
                  Enter Manually
                </h3>
                <p className={`text-sm ${'text-content-secondary'}`}>
                  Add provider information yourself
                </p>
              </button>
            </div>
          )}

          {step === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${'text-content-secondary'}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={specialistMode ? "Search by specialty (e.g., Cardiologist, Dermatologist)..." : "Search by name or specialty..."}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      darkMode
                        ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder'
                        : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder'
                    }`}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className={`font-semibold ${'text-content-primary'}`}>
                    Results
                  </h3>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        darkMode
                          ? 'border-stroke-default hover:border-blue-600 hover:bg-surface-sunken'
                          : 'border-stroke-subtle hover:border-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <div className="font-semibold">{result.name}</div>
                      {result.specialty && <div className={`text-sm ${'text-content-secondary'}`}>{result.specialty}</div>}
                      {result.clinic && <div className={`text-sm ${'text-content-secondary'}`}>{result.clinic}</div>}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setStep('manual')}
                className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                Or enter manually instead
              </button>
            </div>
          )}

          {step === 'manual' && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div>
                <label className={`block text-sm font-medium mb-2 ${'text-content-primary'}`}>
                  Provider Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.name ? 'border-red-500' : darkMode ? 'border-stroke-default bg-surface-sunken text-white' : 'border-stroke-default'
                  }`}
                  placeholder="Dr. Jane Smith"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${'text-content-primary'}`}>
                  Relationship *
                </label>
                <select
                  value={formData.relationship || 'Primary'}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value as ProviderRelationship })}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-stroke-default bg-surface-sunken text-white' : 'border-stroke-default'}`}
                >
                  <option value="Primary">Primary Care</option>
                  <option value="Specialist">Specialist</option>
                  <option value="Dental">Dental</option>
                  <option value="Vision">Vision</option>
                  <option value="Therapy">Therapy</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${'text-content-primary'}`}>
                  Specialty
                </label>
                <input
                  type="text"
                  value={formData.specialty || ''}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-stroke-default bg-surface-sunken text-white' : 'border-stroke-default'}`}
                  placeholder="Cardiology"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${'text-content-primary'}`}>
                  Clinic/Practice
                </label>
                <input
                  type="text"
                  value={formData.clinic || ''}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-stroke-default bg-surface-sunken text-white' : 'border-stroke-default'}`}
                  placeholder="Springfield Medical Center"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${'text-content-primary'}`}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-stroke-default bg-surface-sunken text-white' : 'border-stroke-default'}`}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${'text-content-primary'}`}>
                  Address
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border resize-none ${darkMode ? 'border-stroke-default bg-surface-sunken text-white' : 'border-stroke-default'}`}
                  placeholder="123 Main St, Springfield, IL 62701"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${'text-content-primary'}`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border resize-none ${darkMode ? 'border-stroke-default bg-surface-sunken text-white' : 'border-stroke-default'}`}
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => step === 'manual' && searchQuery ? setStep('search') : setStep('mode')}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    'bg-surface-sunken text-content-primary hover:bg-surface-overlay'
                  }`}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Provider'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
