import { useState, useEffect, MutableRefObject } from 'react';
import { Users, Stethoscope, Pill } from 'lucide-react';
import { NetworkProvider, useNetworkStore } from '../lib/stores/network-store';
import { ProvidersTab } from '../components/network/ProvidersTab';
import { PharmaciesTab } from '../components/network/PharmaciesTab';
import { AddProviderDrawer } from '../components/network/AddProviderDrawer';
import { AddPharmacyDrawer } from '../components/network/AddPharmacyDrawer';
import { Provider, Pharmacy } from '../types/network';
import { Toast } from '../components/Toast';
import { fetchInsuranceContext, type InsuranceContextResult } from '../lib/network/api';

interface NetworkPageProps {
  darkMode?: boolean;
  actionsRef?: MutableRefObject<{
    openAddProvider?: () => void;
    openAddPharmacy?: () => void;
    openFindSpecialist?: () => void;
    refreshData?: () => void;
  }>;
}

type TabId = 'providers' | 'pharmacies';

function NetworkPageContent({ darkMode = false, actionsRef }: NetworkPageProps) {
  const { insurance, loading, removeProvider, removePharmacy, loadData } = useNetworkStore();
  const [activeTab, setActiveTab] = useState<TabId>('providers');
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [specialistMode, setSpecialistMode] = useState(false);
  const [showAddPharmacy, setShowAddPharmacy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [insuranceDetail, setInsuranceDetail] = useState<InsuranceContextResult | null>(null);

  useEffect(() => {
    fetchInsuranceContext()
      .then(setInsuranceDetail)
      .catch(() => {});
  }, []);

  if (actionsRef) {
    actionsRef.current = {
      openAddProvider: () => {
        setActiveTab('providers');
        setSpecialistMode(false);
        setShowAddProvider(true);
      },
      openAddPharmacy: () => {
        setActiveTab('pharmacies');
        setShowAddPharmacy(true);
      },
      openFindSpecialist: () => {
        setActiveTab('providers');
        setSpecialistMode(true);
        setShowAddProvider(true);
      },
      refreshData: loadData,
    };
  }

  const handleRemoveProvider = async (provider: Provider) => {
    if (!confirm(`Remove ${provider.name} from your network?`)) return;
    try {
      await removeProvider(provider.id);
      setToast({ message: 'Provider removed successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to remove provider', type: 'error' });
    }
  };

  const handleRemovePharmacy = async (pharmacy: Pharmacy) => {
    if (!confirm(`Remove ${pharmacy.name} from your network?`)) return;
    try {
      await removePharmacy(pharmacy.id);
      setToast({ message: 'Pharmacy removed successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to remove pharmacy', type: 'error' });
    }
  };

  return (
    <>
      <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            <Users className="w-7 h-7" />
            Your Care Network
          </h1>
          <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
            {insuranceDetail && insuranceDetail.activeCount > 0
              ? insuranceDetail.summary
              : insurance.connected
                ? `Connected with ${insurance.name}. Find providers and set your preferred pharmacy.`
                : 'Search providers and pharmacies, or connect insurance for in-network filtering.'
            }
          </p>
        </div>

        <div className={`flex border-b mb-8 ${darkMode ? 'border-stone-700' : 'border-stone-200'}`}>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative ${
              activeTab === 'providers'
                ? darkMode ? 'text-white' : 'text-stone-900'
                : darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Providers & Specialists
            {activeTab === 'providers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pharmacies')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative ${
              activeTab === 'pharmacies'
                ? darkMode ? 'text-white' : 'text-stone-900'
                : darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Pill className="w-4 h-4" />
            Pharmacies
            {activeTab === 'pharmacies' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'providers' && (
              <ProvidersTab
                darkMode={darkMode}
                onRemoveProvider={handleRemoveProvider}
                onOpenManualAdd={() => {
                  setSpecialistMode(false);
                  setShowAddProvider(true);
                }}
              />
            )}
            {activeTab === 'pharmacies' && (
              <PharmaciesTab
                darkMode={darkMode}
                onRemovePharmacy={handleRemovePharmacy}
                onOpenManualAdd={() => setShowAddPharmacy(true)}
              />
            )}
          </>
        )}
      </div>

      <AddProviderDrawer
        isOpen={showAddProvider}
        onClose={() => {
          setShowAddProvider(false);
          setSpecialistMode(false);
        }}
        darkMode={darkMode}
        specialistMode={specialistMode}
      />

      <AddPharmacyDrawer
        isOpen={showAddPharmacy}
        onClose={() => setShowAddPharmacy(false)}
        darkMode={darkMode}
      />

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

export default function NetworkPage(props: NetworkPageProps) {
  return (
    <NetworkProvider>
      <NetworkPageContent {...props} />
    </NetworkProvider>
  );
}
