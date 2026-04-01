import { useState, useEffect } from 'react';
import { X, Home, Building2, MapPin, Check } from 'lucide-react';
import {
  type AddressType,
  type UserAddress,
  type UserAddressInput,
} from '../../lib/network/api';

interface AddAddressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: UserAddressInput) => Promise<void>;
  darkMode?: boolean;
  existingAddresses: UserAddress[];
  editAddress?: UserAddress | null;
}

const ADDRESS_TYPE_CONFIG: {
  type: AddressType;
  label: string;
  icon: typeof Home;
  description: string;
}[] = [
  { type: 'home_1', label: 'Home', icon: Home, description: 'Primary residence' },
  { type: 'home_2', label: 'Second Home', icon: Home, description: 'Vacation or second residence' },
  { type: 'work', label: 'Work', icon: Building2, description: 'Office or workplace' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

export function AddAddressDrawer({
  isOpen,
  onClose,
  onSave,
  darkMode = false,
  existingAddresses,
  editAddress,
}: AddAddressDrawerProps) {
  const [selectedType, setSelectedType] = useState<AddressType | null>(null);
  const [form, setForm] = useState({
    label: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    isActive: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && editAddress) {
      setSelectedType(editAddress.addressType);
      setForm({
        label: editAddress.label,
        addressLine1: editAddress.addressLine1,
        addressLine2: editAddress.addressLine2 || '',
        city: editAddress.city,
        state: editAddress.state || '',
        postalCode: editAddress.postalCode || '',
        isActive: editAddress.isActive,
      });
    } else if (isOpen) {
      setSelectedType(null);
      setForm({ label: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', isActive: false });
      setErrors({});
    }
  }, [isOpen, editAddress]);

  useEffect(() => {
    if (selectedType && !editAddress) {
      const cfg = ADDRESS_TYPE_CONFIG.find(c => c.type === selectedType);
      if (cfg) setForm(prev => ({ ...prev, label: cfg.label }));
    }
  }, [selectedType, editAddress]);

  const availableTypes = ADDRESS_TYPE_CONFIG.filter(
    cfg => !existingAddresses.some(a => a.addressType === cfg.type) || editAddress?.addressType === cfg.type
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedType) errs.type = 'Select an address type';
    if (!form.addressLine1.trim()) errs.addressLine1 = 'Street address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state) errs.state = 'State is required';
    if (!form.postalCode.trim()) errs.postalCode = 'ZIP code is required';
    else if (!/^\d{5}(-\d{4})?$/.test(form.postalCode.trim())) errs.postalCode = 'Enter a valid ZIP code';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedType) return;
    setSaving(true);
    try {
      await onSave({
        addressType: selectedType,
        label: form.label || ADDRESS_TYPE_CONFIG.find(c => c.type === selectedType)!.label,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim(),
        state: form.state,
        postalCode: form.postalCode.trim(),
        isActive: form.isActive || existingAddresses.length === 0,
      });
      onClose();
    } catch {
      setErrors({ submit: 'Failed to save address. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
      errors[field]
        ? 'border-red-400'
        : darkMode
          ? 'border-stone-700 bg-stone-800 text-white placeholder-stone-500'
          : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400'
    }`;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-lg z-50 shadow-xl flex flex-col ${
        darkMode ? 'bg-stone-900' : 'bg-white'
      }`}>
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
          darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {editAddress ? 'Edit Address' : 'Add an Address'}
            </h2>
            <p className={`text-sm mt-0.5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              {editAddress ? 'Update your address details' : 'Used for nearby pharmacy search'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-stone-800' : 'hover:bg-stone-100'}`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
          {!editAddress && (
            <div>
              <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                Address Type
              </label>
              {availableTypes.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                  All address types are already added.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {availableTypes.map(cfg => {
                    const Icon = cfg.icon;
                    const isSelected = selectedType === cfg.type;
                    return (
                      <button
                        key={cfg.type}
                        type="button"
                        onClick={() => setSelectedType(cfg.type)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/30'
                            : darkMode
                              ? 'border-stone-700 hover:border-stone-600 bg-stone-800/50'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : darkMode
                              ? 'bg-stone-700 text-stone-400'
                              : 'bg-stone-100 text-stone-500'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${
                            isSelected
                              ? darkMode ? 'text-blue-300' : 'text-blue-700'
                              : darkMode ? 'text-white' : 'text-stone-900'
                          }`}>
                            {cfg.label}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            {cfg.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.type && <p className="text-red-500 text-xs mt-1.5">{errors.type}</p>}
            </div>
          )}

          {(selectedType || editAddress) && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                  Label
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={e => setForm(prev => ({ ...prev, label: e.target.value }))}
                  className={inputClass('label')}
                  placeholder="e.g. Home, Mom's House, Downtown Office"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                  Street Address *
                </label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={e => setForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                  className={inputClass('addressLine1')}
                  placeholder="123 Main Street"
                />
                {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                  Apt / Suite / Unit
                </label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={e => setForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                  className={inputClass('addressLine2')}
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                    className={inputClass('city')}
                    placeholder="Springfield"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                    State *
                  </label>
                  <select
                    value={form.state}
                    onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
                    className={inputClass('state')}
                  >
                    <option value="">Select</option>
                    {US_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>
              </div>

              <div className="w-1/2">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={e => setForm(prev => ({ ...prev, postalCode: e.target.value }))}
                  className={inputClass('postalCode')}
                  placeholder="62701"
                  maxLength={10}
                />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
              </div>

              {existingAddresses.length > 0 && (
                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  form.isActive
                    ? darkMode ? 'border-blue-600 bg-blue-950/20' : 'border-blue-300 bg-blue-50/60'
                    : darkMode ? 'border-stone-700 bg-stone-800/50' : 'border-stone-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-300 mt-0.5"
                  />
                  <div>
                    <span className={`text-sm font-medium ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                      Use for pharmacy search
                    </span>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                      Find nearby pharmacies based on this address
                    </p>
                  </div>
                </label>
              )}

              {errors.submit && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}
            </>
          )}
        </div>

        <div className={`sticky bottom-0 z-10 p-6 border-t ${
          darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
        }`}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-5 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || (!selectedType && !editAddress)}
              className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : editAddress ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
