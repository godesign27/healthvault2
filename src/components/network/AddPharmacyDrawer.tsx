import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import { DeliveryOption } from '../../types/network';
import { AddPharmacyInputZ, AddPharmacyInput } from '../../schemas/network';
import { useNetworkStore } from '../../lib/stores/network-store';
import { Toast } from '../Toast';

interface AddPharmacyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

interface NearbyPharmacy {
  name: string;
  chain?: string;
  address: string;
  phone?: string;
  distance?: string;
  lat: number;
  lng: number;
}

export function AddPharmacyDrawer({ isOpen, onClose, darkMode = false }: AddPharmacyDrawerProps) {
  const { addPharmacy } = useNetworkStore();
  const [viewMode, setViewMode] = useState<'map' | 'manual'>('map');
  const [formData, setFormData] = useState<Partial<AddPharmacyInput>>({
    preferred: false,
    deliveryOptions: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<NearbyPharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<NearbyPharmacy | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && viewMode === 'map' && !userLocation) {
      getUserLocation();
    }
  }, [isOpen, viewMode]);

  const getUserLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          searchNearbyPharmacies(location);
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          const defaultLocation = { lat: 37.7749, lng: -122.4194 };
          setUserLocation(defaultLocation);
          searchNearbyPharmacies(defaultLocation);
          setLoadingLocation(false);
        }
      );
    } else {
      const defaultLocation = { lat: 37.7749, lng: -122.4194 };
      setUserLocation(defaultLocation);
      searchNearbyPharmacies(defaultLocation);
      setLoadingLocation(false);
    }
  };

  const searchNearbyPharmacies = (location: { lat: number; lng: number }) => {
    const mockPharmacies: NearbyPharmacy[] = [
      {
        name: 'CVS Pharmacy',
        chain: 'CVS',
        address: '123 Main St',
        phone: '(555) 123-4567',
        distance: '0.3 mi',
        lat: location.lat + 0.002,
        lng: location.lng + 0.002
      },
      {
        name: 'Walgreens',
        chain: 'Walgreens',
        address: '456 Oak Ave',
        phone: '(555) 234-5678',
        distance: '0.5 mi',
        lat: location.lat - 0.003,
        lng: location.lng + 0.001
      },
      {
        name: 'Rite Aid Pharmacy',
        chain: 'Rite Aid',
        address: '789 Elm St',
        phone: '(555) 345-6789',
        distance: '0.7 mi',
        lat: location.lat + 0.001,
        lng: location.lng - 0.004
      },
      {
        name: 'Target Pharmacy',
        chain: 'Target',
        address: '321 Pine Rd',
        phone: '(555) 456-7890',
        distance: '0.9 mi',
        lat: location.lat - 0.002,
        lng: location.lng - 0.002
      },
      {
        name: 'Costco Pharmacy',
        chain: 'Costco',
        address: '654 Market Blvd',
        phone: '(555) 567-8901',
        distance: '1.2 mi',
        lat: location.lat + 0.005,
        lng: location.lng - 0.001
      }
    ];
    setNearbyPharmacies(mockPharmacies);
  };

  const handleSelectPharmacy = (pharmacy: NearbyPharmacy) => {
    setSelectedPharmacy(pharmacy);
    setFormData({
      name: pharmacy.name,
      chain: pharmacy.chain,
      address: pharmacy.address,
      phone: pharmacy.phone,
      preferred: false,
      deliveryOptions: []
    });
  };

  const deliveryOptions: DeliveryOption[] = ['Pickup', 'Delivery', 'Mail'];

  const toggleDeliveryOption = (option: DeliveryOption) => {
    const current = formData.deliveryOptions || [];
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    setFormData({ ...formData, deliveryOptions: updated });
  };

  const handleSubmit = async () => {
    setErrors({});
    const validation = AddPharmacyInputZ.safeParse(formData);

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
      await addPharmacy({
        ...validation.data,
        userId: '00000000-0000-0000-0000-000000000000'
      });
      setToast({ message: 'Pharmacy added successfully!', type: 'success' });
      setTimeout(() => {
        onClose();
        setFormData({ preferred: false, deliveryOptions: [] });
      }, 1500);
    } catch (error) {
      setToast({ message: 'Failed to add pharmacy', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-2xl z-50 ${darkMode ? 'bg-stone-900' : 'bg-white'} shadow-xl flex flex-col`}>
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
            Add Pharmacy
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-stone-800' : 'hover:bg-stone-100'}`}>
            <X className={`w-6 h-6 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-32">
          <div className={`inline-flex rounded-lg p-1 mb-6 ${darkMode ? 'bg-stone-800' : 'bg-stone-100'}`}>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'map'
                  ? darkMode
                    ? 'bg-stone-700 text-white'
                    : 'bg-white text-stone-900 shadow-sm'
                  : darkMode
                  ? 'text-stone-400'
                  : 'text-stone-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Map View
              </div>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('manual')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'manual'
                  ? darkMode
                    ? 'bg-stone-700 text-white'
                    : 'bg-white text-stone-900 shadow-sm'
                  : darkMode
                  ? 'text-stone-400'
                  : 'text-stone-600'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {viewMode === 'map' ? (
            <div className="space-y-4">
              {loadingLocation ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className={`h-64 rounded-xl overflow-hidden border ${darkMode ? 'border-stone-700 bg-stone-800' : 'border-stone-200 bg-stone-100'}`} ref={mapRef}>
                    <div className="relative w-full h-full">
                      <div className={`absolute inset-0 ${darkMode ? 'bg-stone-800' : 'bg-stone-100'}`}>
                        <svg className="w-full h-full" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={darkMode ? '#44403c' : '#d6d3d1'} strokeWidth="0.5"/>
                            </pattern>
                          </defs>
                          <rect width="400" height="300" fill="url(#grid)" />
                          <circle cx="200" cy="150" r="8" fill="#3b82f6" opacity="0.8">
                            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="200" cy="150" r="4" fill="#ffffff" />
                          <circle cx="180" cy="120" r="6" fill="#ef4444" />
                          <circle cx="220" cy="140" r="6" fill="#ef4444" />
                          <circle cx="190" cy="180" r="6" fill="#ef4444" />
                          <circle cx="240" cy="170" r="6" fill="#ef4444" />
                          <circle cx="210" cy="110" r="6" fill="#ef4444" />
                        </svg>
                      </div>
                      <div className="absolute top-4 right-4">
                        <button
                          type="button"
                          onClick={getUserLocation}
                          className={`p-2 rounded-lg shadow-lg transition-colors ${
                            darkMode ? 'bg-stone-700 hover:bg-stone-600' : 'bg-white hover:bg-stone-50'
                          }`}
                          title="Get current location"
                        >
                          <Navigation className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-stone-700'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                      Nearby Pharmacies
                    </h3>
                    {nearbyPharmacies.map((pharmacy, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPharmacy(pharmacy)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          selectedPharmacy?.name === pharmacy.name
                            ? darkMode
                              ? 'bg-blue-900/30 border-2 border-blue-600'
                              : 'bg-blue-50 border-2 border-blue-600'
                            : darkMode
                            ? 'bg-stone-800 border border-stone-700 hover:border-stone-600'
                            : 'bg-white border border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                                {pharmacy.name}
                              </h4>
                              {pharmacy.distance && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  darkMode ? 'bg-stone-700 text-stone-300' : 'bg-stone-100 text-stone-600'
                                }`}>
                                  {pharmacy.distance}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                              {pharmacy.address}
                            </p>
                            {pharmacy.phone && (
                              <p className={`text-sm mt-1 ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>
                                {pharmacy.phone}
                              </p>
                            )}
                          </div>
                          <MapPin className={`w-5 h-5 shrink-0 ${
                            selectedPharmacy?.name === pharmacy.name
                              ? 'text-blue-600'
                              : darkMode
                              ? 'text-stone-600'
                              : 'text-stone-400'
                          }`} />
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedPharmacy && (
                    <div className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200'
                    }`}>
                      <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                        Delivery Options
                      </h4>
                      <div className="flex gap-3 mb-4">
                        {deliveryOptions.map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleDeliveryOption(option)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              formData.deliveryOptions?.includes(option)
                                ? 'bg-blue-600 text-white'
                                : darkMode
                                ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preferred || false}
                          onChange={(e) => setFormData({ ...formData, preferred: e.target.checked })}
                          className="w-4 h-4 rounded border-stone-300"
                        />
                        <span className={`text-sm ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                          Set as preferred pharmacy
                        </span>
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Pharmacy Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.name ? 'border-red-500' : darkMode ? 'border-stone-700 bg-stone-800 text-white' : 'border-stone-300'
                }`}
                placeholder="CVS Pharmacy"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Chain
              </label>
              <input
                type="text"
                value={formData.chain || ''}
                onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-stone-700 bg-stone-800 text-white' : 'border-stone-300'}`}
                placeholder="CVS, Walgreens, Independent"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-stone-700 bg-stone-800 text-white' : 'border-stone-300'}`}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Address
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border resize-none ${darkMode ? 'border-stone-700 bg-stone-800 text-white' : 'border-stone-300'}`}
                placeholder="123 Main St, Springfield, IL 62701"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Delivery Options
              </label>
              <div className="flex gap-3">
                {deliveryOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleDeliveryOption(option)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.deliveryOptions?.includes(option)
                        ? 'bg-blue-600 text-white'
                        : darkMode
                        ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="preferred"
                checked={formData.preferred || false}
                onChange={(e) => setFormData({ ...formData, preferred: e.target.checked })}
                className="w-5 h-5 rounded border-stone-300"
              />
              <label htmlFor="preferred" className={`ml-3 text-sm font-medium ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Set as preferred pharmacy
              </label>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border resize-none ${darkMode ? 'border-stone-700 bg-stone-800 text-white' : 'border-stone-300'}`}
                placeholder="Any additional information..."
              />
            </div>
          </form>
          )}

        </div>

        <div className={`sticky bottom-0 z-10 p-6 border-t ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              Cancel
            </button>
            {(viewMode === 'map' && selectedPharmacy) || viewMode === 'manual' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Adding...' : 'Add Pharmacy'}
              </button>
            ) : null}
          </div>
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
