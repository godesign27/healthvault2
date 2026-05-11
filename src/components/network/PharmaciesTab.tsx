import { useState, useEffect } from 'react';
import {
  MapPin, Phone, Clock, Star, Navigation, Check, Package,
  ExternalLink, CheckCircle, XCircle, Pill, Plus, Home,
  Building2, Pencil, Trash2, Radio,
} from 'lucide-react';
import { useNetworkStore } from '../../lib/stores/network-store';
import { NearbyPharmacyResult, getNearbyPharmacies as getMockNearbyPharmacies } from '../../lib/network-directory';
import {
  fetchNearbyPharmacies,
  setPreferredPharmacyApi,
  fetchUserAddresses,
  saveUserAddress,
  setActiveAddress,
  deleteUserAddress,
  getActiveAddressContext,
  type AddressContext,
  type UserAddress,
  type UserAddressInput,
} from '../../lib/network/api';
import { AddAddressDrawer } from './AddAddressDrawer';
import { PharmacyCard } from './PharmacyCard';
import { Pharmacy } from '../../types/network';

interface PharmaciesTabProps {
  darkMode: boolean;
  onRemovePharmacy: (pharmacy: Pharmacy) => void;
  onOpenManualAdd: () => void;
}

export function PharmaciesTab({ darkMode, onRemovePharmacy, onOpenManualAdd }: PharmaciesTabProps) {
  const { pharmacies, addPharmacy, updatePharmacy, loadData, insurance } = useNetworkStore();
  const [nearbyPharmacies, setNearbyPharmacies] = useState<NearbyPharmacyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addressContext, setAddressContext] = useState<AddressContext | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAddresses = async () => {
    try {
      const result = await fetchUserAddresses();
      setAddresses(result);
      setAddressesLoaded(true);
      const ctx = getActiveAddressContext(result);
      setAddressContext(ctx);
      return ctx;
    } catch {
      setAddressesLoaded(true);
      return null;
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ctx, mockData] = await Promise.all([
        loadAddresses(),
        getMockNearbyPharmacies(),
      ]);
      setNearbyPharmacies(mockData);
    } catch {
      try {
        const mockData = await getMockNearbyPharmacies();
        setNearbyPharmacies(mockData);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (input: UserAddressInput) => {
    await saveUserAddress(undefined, input);
    await loadAddresses();
  };

  const handleSetActive = async (addr: UserAddress) => {
    await setActiveAddress(undefined, addr.id);
    await loadAddresses();
  };

  const handleDeleteAddress = async (addr: UserAddress) => {
    if (!confirm(`Remove your ${addr.label} address?`)) return;
    await deleteUserAddress(undefined, addr.id);
    await loadAddresses();
  };

  const preferredPharmacy = pharmacies.find(p => p.preferred);

  const handleDesignate = async (np: NearbyPharmacyResult) => {
    setAddingId(np.id);
    try {
      const alreadyAdded = pharmacies.find(p => p.name === np.name);
      if (alreadyAdded) {
        await setPreferredPharmacyApi(
          '00000000-0000-0000-0000-000000000000',
          alreadyAdded.id
        );
      } else {
        if (preferredPharmacy) {
          await updatePharmacy(preferredPharmacy.id, { preferred: false });
        }
        await addPharmacy({
          userId: '00000000-0000-0000-0000-000000000000',
          name: np.name,
          chain: np.chain,
          phone: np.phone.replace(/[^\d]/g, ''),
          address: np.address,
          preferred: true,
          deliveryOptions: np.deliveryOptions,
          inNetwork: np.inNetwork,
        });
      }
      await loadData();
    } catch {
      // handled silently
    } finally {
      setAddingId(null);
    }
  };

  const handleSetSavedPreferred = async (pharmacy: Pharmacy) => {
    setAddingId(pharmacy.id);
    try {
      await setPreferredPharmacyApi(
        '00000000-0000-0000-0000-000000000000',
        pharmacy.id
      );
      await loadData();
    } catch {
      // handled silently
    } finally {
      setAddingId(null);
    }
  };

  const hasAddress = addressesLoaded ? !!addressContext : true;
  const cityLabel = addressContext
    ? `${addressContext.city}, ${addressContext.state || ''} ${addressContext.postalCode || ''}`.trim()
    : 'Springfield, IL 62701';
  const mapLat = 39.7817;
  const mapLng = -89.6501;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.06}%2C${mapLat - 0.04}%2C${mapLng + 0.06}%2C${mapLat + 0.04}&layer=mapnik&marker=${mapLat}%2C${mapLng}`;
  const canAddMore = addresses.length < 3;
  const addressTypeIcon = (type: string) => type === 'work' ? Building2 : Home;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-medium uppercase tracking-wider ${
              'text-content-secondary'
            }`}>Your Addresses</h3>
            <p className={`text-xs mt-0.5 ${'text-content-secondary'}`}>
              Used to find nearby pharmacies
            </p>
          </div>
          {canAddMore && addresses.length > 0 && (
            <button
              onClick={() => { setEditingAddress(null); setShowAddAddress(true); }}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                darkMode
                  ? 'text-blue-400 hover:bg-surface-sunken'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Address
            </button>
          )}
        </div>

        {addresses.length === 0 ? (
          <button
            onClick={() => { setEditingAddress(null); setShowAddAddress(true); }}
            className={`w-full p-6 rounded-xl border-2 border-dashed text-center transition-colors group ${
              darkMode
                ? 'border-stroke-default hover:border-stroke-default'
                : 'border-stroke-default hover:border-blue-400'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors ${
              darkMode
                ? 'bg-surface-sunken text-content-secondary group-hover:text-blue-400'
                : 'bg-surface-sunken text-content-secondary group-hover:text-blue-600'
            }`}>
              <MapPin className="w-6 h-6" />
            </div>
            <p className={`font-medium mb-1 ${'text-content-primary'}`}>
              Add your first address
            </p>
            <p className={`text-sm ${'text-content-secondary'}`}>
              Home, second home, or work -- used to find pharmacies near you
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {addresses.map(addr => {
              const Icon = addressTypeIcon(addr.addressType);
              return (
                <div
                  key={addr.id}
                  className={`relative p-4 transition-all ${
                    addr.isActive
                      ? darkMode
                        ? 'rounded-xl border border-blue-600 bg-blue-950/20 ring-1 ring-blue-600/30'
                        : 'rounded-xl border border-blue-400 bg-blue-50/50 ring-1 ring-blue-200'
                      : darkMode
                        ? 'hv-surface-card'
                        : 'rounded-xl border border-stroke-subtle bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        addr.isActive
                          ? 'bg-blue-600 text-white'
                          : darkMode
                            ? 'bg-surface-sunken text-content-secondary'
                            : 'bg-surface-sunken text-content-secondary'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${'text-content-primary'}`}>
                          {addr.label}
                        </p>
                        {addr.isActive && (
                          <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">Active</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {!addr.isActive && (
                        <button
                          onClick={() => handleSetActive(addr)}
                          title="Use for pharmacy search"
                          className={`p-1.5 rounded-md transition-colors ${
                            'hover:bg-surface-sunken text-content-secondary hover:text-blue-500'
                          }`}
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingAddress(addr); setShowAddAddress(true); }}
                        title="Edit"
                        className={`p-1.5 rounded-md transition-colors ${
                          'hover:bg-surface-sunken text-content-secondary hover:text-content-primary'
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr)}
                        title="Remove"
                        className={`p-1.5 rounded-md transition-colors ${
                          'hover:bg-surface-sunken text-content-secondary hover:text-red-400'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${'text-content-secondary'}`}>
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                    <br />
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {preferredPharmacy && (
        <section className={`rounded-xl border-2 p-5 ${
          darkMode ? 'border-emerald-800 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/60'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <h3 className={`font-semibold ${'text-content-primary'}`}>
              Your Preferred Pharmacy
            </h3>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${'text-content-primary'}`}>
                {preferredPharmacy.name}
              </h4>
              {preferredPharmacy.address && (
                <p className={`text-sm mt-0.5 ${'text-content-secondary'}`}>
                  {preferredPharmacy.address}
                </p>
              )}
              {preferredPharmacy.phone && (
                <p className={`text-sm mt-0.5 ${'text-content-secondary'}`}>
                  {preferredPharmacy.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                </p>
              )}
              {preferredPharmacy.deliveryOptions && preferredPharmacy.deliveryOptions.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {preferredPharmacy.deliveryOptions.map(opt => (
                    <span key={opt} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {preferredPharmacy.inNetwork && (
              <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap shrink-0">
                <CheckCircle className="w-3 h-3" />
                In-Network
              </span>
            )}
          </div>
        </section>
      )}

      {pharmacies.length > 0 && pharmacies.filter(p => !p.preferred).length > 0 && (
        <section>
          <h3 className={`text-sm font-medium uppercase tracking-wider mb-3 ${
            'text-content-secondary'
          }`}>Other Saved Pharmacies</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pharmacies.filter(p => !p.preferred).map(pharmacy => (
              <div key={pharmacy.id} className="relative">
                <PharmacyCard
                  pharmacy={pharmacy}
                  darkMode={darkMode}
                  onRemove={onRemovePharmacy}
                />
                {!pharmacy.preferred && (
                  <button
                    onClick={() => handleSetSavedPreferred(pharmacy)}
                    disabled={addingId === pharmacy.id}
                    className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors z-10 ${
                      darkMode
                        ? 'bg-surface-sunken text-content-primary hover:bg-surface-overlay'
                        : 'bg-surface-sunken text-content-secondary hover:bg-surface-overlay'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    Set Preferred
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <h2 className={`text-lg font-semibold ${'text-content-primary'}`}>
              Nearby Pharmacies
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

        {hasAddress ? (
          <>
            <p className={`text-sm mb-5 ${'text-content-secondary'}`}>
              Based on your saved address in {cityLabel}
              {insurance.connected && `. ${insurance.name} network status shown.`}
            </p>

            <div className={`rounded-xl overflow-hidden border mb-6 ${
              'border-stroke-subtle'
            }`}>
              <div className="relative w-full h-64 lg:h-72">
                <iframe
                  src={mapSrc}
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  title={`Pharmacy locations near ${cityLabel}`}
                />
                <div className={`absolute bottom-3 left-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-lg ${
                  darkMode ? 'bg-surface-sunken text-content-primary' : 'bg-surface-raised text-content-primary'
                }`}>
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  {cityLabel}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : nearbyPharmacies.length === 0 ? (
              <div className="hv-surface-card py-16 text-center">
                <Pill className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-content-tertiary' : 'text-content-tertiary'}`} />
                <p className={`font-medium ${'text-content-primary'}`}>
                  No pharmacies found nearby
                </p>
                <p className={`text-sm mt-1 ${'text-content-secondary'}`}>
                  You can add a pharmacy manually to your profile.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyPharmacies.map((np, idx) => {
                  const isDesignated = preferredPharmacy?.name === np.name;
                  const isAdding = addingId === np.id;
                  const isSelected = selectedId === np.id;

                  return (
                    <PharmacyResultCard
                      key={np.id}
                      pharmacy={np}
                      index={idx}
                      darkMode={darkMode}
                      isDesignated={isDesignated}
                      isSelected={isSelected}
                      isAdding={isAdding}
                      onSelect={() => setSelectedId(np.id === selectedId ? null : np.id)}
                      onDesignate={() => handleDesignate(np)}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="hv-surface-card mt-4 py-12 text-center">
            <MapPin className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-content-tertiary' : 'text-content-tertiary'}`} />
            <p className={`font-medium mb-1 ${'text-content-primary'}`}>
              Add an address to see nearby pharmacies
            </p>
            <p className={`text-sm max-w-sm mx-auto mb-4 ${'text-content-secondary'}`}>
              Use the address section above, or add a pharmacy manually.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setEditingAddress(null); setShowAddAddress(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </button>
              <button
                onClick={onOpenManualAdd}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-surface-sunken text-content-primary hover:bg-surface-sunken'
                    : 'bg-surface-sunken text-content-primary hover:bg-surface-overlay'
                }`}
              >
                + Add Pharmacy
              </button>
            </div>
          </div>
        )}
      </section>

      <AddAddressDrawer
        isOpen={showAddAddress}
        onClose={() => { setShowAddAddress(false); setEditingAddress(null); }}
        onSave={handleSaveAddress}
        darkMode={darkMode}
        existingAddresses={addresses}
        editAddress={editingAddress}
      />
    </div>
  );
}

function PharmacyResultCard({
  pharmacy, index, darkMode, isDesignated, isSelected, isAdding, onSelect, onDesignate,
}: {
  pharmacy: NearbyPharmacyResult;
  index: number;
  darkMode: boolean;
  isDesignated: boolean;
  isSelected: boolean;
  isAdding: boolean;
  onSelect: () => void;
  onDesignate: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer p-5 transition-all ${
        isDesignated
          ? darkMode
            ? 'rounded-xl border border-emerald-700 bg-emerald-950/20'
            : 'rounded-xl border border-emerald-300 bg-emerald-50/50'
          : isSelected
            ? darkMode
              ? 'rounded-xl border border-blue-600 bg-blue-950/20'
              : 'rounded-xl border border-blue-300 bg-blue-50/30'
            : darkMode
              ? 'hv-surface-card hv-surface-card--interactive'
              : 'rounded-xl border border-stroke-subtle bg-white hover:border-stroke-default hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
          isDesignated ? 'bg-emerald-600' : pharmacy.inNetwork ? 'bg-blue-600' : 'bg-hv-neutral-500'
        }`}>
          {pharmacy.distance === 'Mail'
            ? <Package className="w-5 h-5" />
            : index + 1
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={`font-semibold truncate ${'text-content-primary'}`}>
                {pharmacy.name}
              </h3>
              {isDesignated && <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pharmacy.distance !== 'Mail' && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  'bg-surface-sunken text-content-secondary'
                }`}>
                  {pharmacy.distance}
                </span>
              )}
              {pharmacy.inNetwork ? (
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  In-Network
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  <XCircle className="w-3 h-3" />
                  Out-of-Network
                </span>
              )}
            </div>
          </div>

          <p className={`text-sm ${'text-content-secondary'}`}>
            {pharmacy.chain !== 'Independent' ? pharmacy.chain : 'Independent Pharmacy'}
          </p>

          <div className={`space-y-1 mt-2 text-xs ${'text-content-secondary'}`}>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{pharmacy.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{pharmacy.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{pharmacy.hours}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {pharmacy.deliveryOptions.map(opt => (
              <span key={opt} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                'bg-surface-sunken text-content-secondary'
              }`}>
                {opt}
              </span>
            ))}
          </div>

          <div
            className={`flex items-center gap-3 mt-3 pt-3 border-t ${
              'border-stroke-subtle'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {isDesignated ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <Check className="w-4 h-4" />
                Your Preferred Pharmacy
              </span>
            ) : (
              <button
                onClick={onDesignate}
                disabled={isAdding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isAdding ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Star className="w-3.5 h-3.5" />
                )}
                Set as Preferred
              </button>
            )}
            {pharmacy.distance !== 'Mail' && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pharmacy.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  darkMode ? 'text-content-secondary hover:bg-surface-sunken' : 'text-content-secondary hover:bg-surface-sunken'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
