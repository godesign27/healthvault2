import { useState, MutableRefObject } from 'react';
import { Users } from 'lucide-react';
import { NetworkProvider, useNetworkStore } from '../lib/stores/network-store';
import { ProviderCard } from '../components/network/ProviderCard';
import { PharmacyCard } from '../components/network/PharmacyCard';
import { AddProviderDrawer } from '../components/network/AddProviderDrawer';
import { AddPharmacyDrawer } from '../components/network/AddPharmacyDrawer';
import { Provider, Pharmacy } from '../types/network';
import { Toast } from '../components/Toast';

interface NetworkPageProps {
  darkMode?: boolean;
  actionsRef?: MutableRefObject<{
    openAddProvider?: () => void;
    openAddPharmacy?: () => void;
    openFindSpecialist?: () => void;
    refreshData?: () => void;
  }>;
}

function NetworkPageContent({ darkMode = false, actionsRef }: NetworkPageProps) {
  const { providers, pharmacies, insurance, loading, removeProvider, removePharmacy, loadData } = useNetworkStore();
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [specialistMode, setSpecialistMode] = useState(false);
  const [showAddPharmacy, setShowAddPharmacy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (actionsRef) {
    actionsRef.current = {
      openAddProvider: () => {
        setSpecialistMode(false);
        setShowAddProvider(true);
      },
      openAddPharmacy: () => setShowAddPharmacy(true),
      openFindSpecialist: () => {
        setSpecialistMode(true);
        setShowAddProvider(true);
      },
      refreshData: loadData
    };
  }

  const handleRemoveProvider = async (provider: Provider) => {
    if (!confirm(`Remove ${provider.name} from your network?`)) return;

    try {
      await removeProvider(provider.id);
      setToast({ message: 'Provider removed successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to remove provider', type: 'error' });
    }
  };

  const handleRemovePharmacy = async (pharmacy: Pharmacy) => {
    if (!confirm(`Remove ${pharmacy.name} from your network?`)) return;

    try {
      await removePharmacy(pharmacy.id);
      setToast({ message: 'Pharmacy removed successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to remove pharmacy', type: 'error' });
    }
  };

  return (
    <>
      <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            <Users className="w-7 h-7" />
            Your Care Network
          </h1>
          <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
            {insurance.connected
              ? `Connected with ${insurance.name}. Showing in-network tags.`
              : "Insurance isn't connected — you can still add doctors and pharmacies."
            }
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <section className="mb-12">
              <div className="mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  Primary Care & Specialists
                </h2>
              </div>

              {providers.length === 0 ? (
                <div className={`text-center py-16 rounded-xl border ${
                  darkMode ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-white'
                }`}>
                  <Users className={`w-16 h-16 mx-auto mb-4 ${
                    darkMode ? 'text-stone-700' : 'text-stone-300'
                  }`} />
                  <h3 className={`text-lg font-semibold mb-2 ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>
                    No providers yet
                  </h3>
                  <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
                    {insurance.connected
                      ? "Use the AI Assistant to add an in-network doctor."
                      : "Use the AI Assistant to add any provider you see."
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {providers.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      darkMode={darkMode}
                      onView={() => {}}
                      onEdit={() => {}}
                      onShare={() => {}}
                      onRemove={handleRemoveProvider}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  Pharmacies
                </h2>
              </div>

              {pharmacies.length === 0 ? (
                <div className={`text-center py-16 rounded-xl border ${
                  darkMode ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-white'
                }`}>
                  <Users className={`w-16 h-16 mx-auto mb-4 ${
                    darkMode ? 'text-stone-700' : 'text-stone-300'
                  }`} />
                  <h3 className={`text-lg font-semibold mb-2 ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>
                    No pharmacies yet
                  </h3>
                  <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
                    Use the AI Assistant to add your preferred pharmacy
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pharmacies.map((pharmacy) => (
                    <PharmacyCard
                      key={pharmacy.id}
                      pharmacy={pharmacy}
                      darkMode={darkMode}
                      onView={() => {}}
                      onEdit={() => {}}
                      onShare={() => {}}
                      onRemove={handleRemovePharmacy}
                    />
                  ))}
                </div>
              )}
            </section>
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
