import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Check, Phone, MapPin, Building2, Languages,
  UserCheck, ChevronDown, ChevronUp, CheckCircle, Stethoscope,
  ShieldCheck, ShieldX, UserPlus,
} from 'lucide-react';
import { useNetworkStore } from '../../lib/stores/network-store';
import {
  DirectoryProvider, SPECIALTY_CATEGORIES, getInNetworkDirectory,
} from '../../lib/network-directory';
import {
  fetchCareNetwork,
  type CareNetworkProvider,
} from '../../lib/network/api';
import { ProviderCard } from './ProviderCard';
import { Provider } from '../../types/network';

interface ProvidersTabProps {
  darkMode: boolean;
  onRemoveProvider: (provider: Provider) => void;
  onOpenManualAdd: () => void;
}

export function ProvidersTab({ darkMode, onRemoveProvider, onOpenManualAdd }: ProvidersTabProps) {
  const { providers, addProvider, insurance } = useNetworkStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [directory, setDirectory] = useState<DirectoryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [showMyProviders, setShowMyProviders] = useState(true);
  const [careNetwork, setCareNetwork] = useState<CareNetworkProvider[]>([]);

  useEffect(() => {
    loadDirectory();
    loadCareNetworkData();
  }, []);

  useEffect(() => {
    loadCareNetworkData();
  }, [providers]);

  const loadDirectory = async () => {
    setLoading(true);
    try {
      const data = await getInNetworkDirectory();
      setDirectory(data);
    } finally {
      setLoading(false);
    }
  };

  const loadCareNetworkData = async () => {
    try {
      const result = await fetchCareNetwork();
      setCareNetwork(result.allProviders);
    } catch {
      // Falls back to store providers
    }
  };

  const addedNpis = useMemo(() => {
    return new Set(providers.map(p => p.npi).filter(Boolean));
  }, [providers]);

  const filteredDirectory = useMemo(() => {
    let results = directory;
    if (selectedCategory !== 'All') {
      results = results.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q) ||
        p.clinic.toLowerCase().includes(q)
      );
    }
    return results;
  }, [directory, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: directory.length };
    directory.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [directory]);

  const handleAddProvider = async (dp: DirectoryProvider) => {
    setAddingId(dp.id);
    try {
      await addProvider({
        userId: '00000000-0000-0000-0000-000000000000',
        npi: dp.npi,
        name: dp.name,
        specialty: dp.specialty,
        clinic: dp.clinic,
        phone: dp.phone.replace(/[^\d]/g, ''),
        address: dp.address,
        relationship: dp.category === 'Primary Care' ? 'Primary' : 'Specialist',
        connectionSource: 'FHIR',
        inNetwork: true,
      });
    } catch {
      // handled silently
    } finally {
      setAddingId(null);
    }
  };

  const primaryProviders = providers.filter(p => p.relationship === 'Primary');
  const specialistProviders = providers.filter(p => p.relationship !== 'Primary');

  const getInsuranceLabel = (provider: Provider): string | null => {
    const networkData = careNetwork.find(p => p.id === provider.id);
    if (networkData?.insuranceLabel) return networkData.insuranceLabel;
    if (!insurance.connected) return null;
    if (provider.inNetwork === true) return `In-network with ${insurance.name}`;
    if (provider.inNetwork === false) return 'Out of network';
    return null;
  };

  return (
    <div className="space-y-8">
      {providers.length > 0 ? (
        <section>
          <button
            onClick={() => setShowMyProviders(!showMyProviders)}
            className={`flex items-center justify-between w-full mb-4 group ${darkMode ? 'text-white' : 'text-stone-900'}`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Your Care Team</h2>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                darkMode ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
              }`}>
                {providers.length}
              </span>
            </div>
            {showMyProviders
              ? <ChevronUp className="w-5 h-5" />
              : <ChevronDown className="w-5 h-5" />
            }
          </button>

          {showMyProviders && (
            <div className="space-y-6">
              {primaryProviders.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${
                    darkMode ? 'text-stone-400' : 'text-stone-500'
                  }`}>Primary Care</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {primaryProviders.map(p => (
                      <div key={p.id} className="relative">
                        <ProviderCard
                          provider={p} darkMode={darkMode}
                          onRemove={onRemoveProvider}
                        />
                        <InsuranceBadge label={getInsuranceLabel(p)} darkMode={darkMode} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {specialistProviders.length > 0 && (
                <div>
                  <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${
                    darkMode ? 'text-stone-400' : 'text-stone-500'
                  }`}>Specialists</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {specialistProviders.map(p => (
                      <div key={p.id} className="relative">
                        <ProviderCard
                          provider={p} darkMode={darkMode}
                          onRemove={onRemoveProvider}
                        />
                        <InsuranceBadge label={getInsuranceLabel(p)} darkMode={darkMode} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className={`rounded-xl border-2 border-dashed p-8 text-center ${
          darkMode ? 'border-stone-700 bg-stone-900/30' : 'border-stone-300 bg-stone-50/50'
        }`}>
          <UserPlus className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`} />
          <h3 className={`font-semibold text-lg mb-1 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
            Your care team is empty
          </h3>
          <p className={`text-sm mb-4 max-w-md mx-auto ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            Start by adding your primary care doctor. You can browse the directory below or add a provider manually.
          </p>
          <button
            onClick={onOpenManualAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add a Provider
          </button>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {insurance.connected
                ? `${insurance.name} In-Network Directory`
                : 'Provider Directory'
              }
            </h2>
          </div>
          <button
            onClick={onOpenManualAdd}
            className={`text-sm font-medium ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            + Add manually
          </button>
        </div>
        <p className={`text-sm mb-5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          {insurance.connected
            ? `Showing providers matched to your connected ${insurance.name} plan`
            : 'Browse providers and add them to your care team. Connect insurance on the Insurance page for in-network filtering.'
          }
        </p>

        <div className="relative mb-5">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
            darkMode ? 'text-stone-500' : 'text-stone-400'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, specialty, or clinic..."
            className={`w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-colors ${
              darkMode
                ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500 focus:border-blue-500'
                : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-1 px-1">
          {SPECIALTY_CATEGORIES.filter(c => c === 'All' || (categoryCounts[c] || 0) > 0).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-sm'
                  : darkMode
                  ? 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                  : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              {category}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : darkMode ? 'bg-stone-700 text-stone-400' : 'bg-stone-100 text-stone-500'
              }`}>
                {categoryCounts[category] || 0}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDirectory.length === 0 ? (
          <div className={`text-center py-16 rounded-xl border ${
            darkMode ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-white'
          }`}>
            <Search className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-stone-700' : 'text-stone-300'}`} />
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>No providers found</p>
            <p className={`text-sm mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <>
            <p className={`text-sm mb-4 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              {filteredDirectory.length} provider{filteredDirectory.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDirectory.map(dp => (
                <DirectoryCard
                  key={dp.id}
                  provider={dp}
                  darkMode={darkMode}
                  isAdded={addedNpis.has(dp.npi)}
                  isAdding={addingId === dp.id}
                  onAdd={() => handleAddProvider(dp)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function InsuranceBadge({ label, darkMode }: { label: string | null; darkMode: boolean }) {
  if (!label) return null;

  const isInNetwork = label.startsWith('In-network');

  return (
    <div className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full z-10 ${
      isInNetwork
        ? 'bg-green-100 text-green-700'
        : darkMode
          ? 'bg-orange-900/30 text-orange-400'
          : 'bg-orange-100 text-orange-700'
    }`}>
      {isInNetwork
        ? <ShieldCheck className="w-3 h-3" />
        : <ShieldX className="w-3 h-3" />
      }
      {label}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  'Primary Care': 'bg-blue-600',
  'Cardiology': 'bg-red-600',
  'Dermatology': 'bg-amber-600',
  'Orthopedics': 'bg-teal-600',
  'Pediatrics': 'bg-sky-600',
  'OB/GYN': 'bg-pink-600',
  'Neurology': 'bg-cyan-700',
  'Gastroenterology': 'bg-orange-600',
  'Ophthalmology': 'bg-emerald-600',
  'ENT': 'bg-lime-700',
  'Psychiatry': 'bg-rose-600',
  'Urgent Care': 'bg-red-500',
};

function DirectoryCard({
  provider, darkMode, isAdded, isAdding, onAdd,
}: {
  provider: DirectoryProvider;
  darkMode: boolean;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
}) {
  const initials = provider.name
    .replace(/^Dr\.\s*/, '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarColor = CATEGORY_COLORS[provider.category] || 'bg-stone-600';

  return (
    <div className={`rounded-xl border p-5 transition-all ${
      isAdded
        ? darkMode
          ? 'border-emerald-800/50 bg-emerald-950/20'
          : 'border-emerald-200 bg-emerald-50/30'
        : darkMode
        ? 'border-stone-700 bg-stone-900 hover:border-stone-600'
        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
    }`}>
      <div className="flex gap-4">
        <div className={`w-11 h-11 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {provider.name}
            </h3>
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap shrink-0">
              <CheckCircle className="w-3 h-3" />
              In-Network
            </span>
          </div>

          <p className={`text-sm font-medium mb-0.5 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
            {provider.specialty}
          </p>

          <div className={`space-y-1 mt-2 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{provider.clinic}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{provider.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{provider.phone}</span>
            </div>
            {provider.languages.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 shrink-0" />
                <span>{provider.languages.join(', ')}</span>
              </div>
            )}
          </div>

          <div className={`flex items-center justify-between mt-3 pt-3 border-t ${
            darkMode ? 'border-stone-800' : 'border-stone-200'
          }`}>
            <div className="flex items-center gap-2">
              {provider.acceptingNewPatients ? (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  Accepting patients
                </span>
              ) : (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
                }`}>
                  Not accepting
                </span>
              )}
              <span className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {provider.distance}
              </span>
            </div>

            {isAdded ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <Check className="w-4 h-4" />
                Added
              </span>
            ) : (
              <button
                onClick={onAdd}
                disabled={isAdding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isAdding ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Save to My Network
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
