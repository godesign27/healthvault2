import { useState } from 'react';
import { Check, AlertCircle, ChevronRight, Eye, EyeOff } from 'lucide-react';
import type { ProviderConnection } from '../../lib/providers/types';

interface ImportData {
  conditions: { unique: any[]; duplicates: any[]; invalid: any[] };
  medications: { unique: any[]; duplicates: any[]; invalid: any[] };
  allergies: { unique: any[]; duplicates: any[]; invalid: any[] };
  immunizations: { unique: any[]; duplicates: any[]; invalid: any[] };
}

interface ImportReviewDialogProps {
  open: boolean;
  onClose: () => void;
  connection: ProviderConnection;
  data: ImportData;
  onConfirm: (selected: ImportData) => Promise<void>;
  darkMode?: boolean;
}

type TabType = 'conditions' | 'medications' | 'allergies' | 'immunizations';

export function ImportReviewDialog({
  open,
  onClose,
  connection,
  data,
  onConfirm,
  darkMode = false,
}: ImportReviewDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('conditions');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<TabType, Set<number>>>({
    conditions: new Set(data.conditions.unique.map((_, i) => i)),
    medications: new Set(data.medications.unique.map((_, i) => i)),
    allergies: new Set(data.allergies.unique.map((_, i) => i)),
    immunizations: new Set(data.immunizations.unique.map((_, i) => i)),
  });
  const [confirming, setConfirming] = useState(false);

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'conditions', label: 'Conditions', count: data.conditions.unique.length },
    { id: 'medications', label: 'Medications', count: data.medications.unique.length },
    { id: 'allergies', label: 'Allergies', count: data.allergies.unique.length },
    { id: 'immunizations', label: 'Immunizations', count: data.immunizations.unique.length },
  ];

  const currentData = data[activeTab];
  const currentSelected = selectedItems[activeTab];

  const totalDuplicates = Object.values(data).reduce((sum, d) => sum + d.duplicates.length, 0);
  const totalSelected = Object.values(selectedItems).reduce((sum, set) => sum + set.size, 0);

  const toggleItem = (index: number) => {
    const newSet = new Set(currentSelected);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedItems({ ...selectedItems, [activeTab]: newSet });
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const selectedData: ImportData = {
        conditions: {
          unique: data.conditions.unique.filter((_, i) => selectedItems.conditions.has(i)),
          duplicates: [],
          invalid: [],
        },
        medications: {
          unique: data.medications.unique.filter((_, i) => selectedItems.medications.has(i)),
          duplicates: [],
          invalid: [],
        },
        allergies: {
          unique: data.allergies.unique.filter((_, i) => selectedItems.allergies.has(i)),
          duplicates: [],
          invalid: [],
        },
        immunizations: {
          unique: data.immunizations.unique.filter((_, i) => selectedItems.immunizations.has(i)),
          duplicates: [],
          invalid: [],
        },
      };

      await onConfirm(selectedData);
    } finally {
      setConfirming(false);
    }
  };

  if (!open) return null;

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-stone-900' : 'bg-white'}`}>
      <div className={`p-6 border-b ${darkMode ? 'border-stone-800' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Review Import</h3>
        <p className={`text-sm mt-1 ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>
          From {connection.name} • {totalSelected} items selected
        </p>
      </div>

      {totalDuplicates > 0 && (
        <div className={`mx-6 mt-4 p-4 rounded-lg border ${darkMode ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
                {totalDuplicates} duplicate {totalDuplicates === 1 ? 'record' : 'records'} hidden
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                Records matching existing data by code and date have been automatically excluded.
              </p>
              <button
                onClick={() => setShowDuplicates(!showDuplicates)}
                className={`mt-2 text-sm font-medium flex items-center gap-1 ${darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'}`}
              >
                {showDuplicates ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDuplicates ? 'Hide' : 'Show'} duplicates
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`border-b px-6 ${darkMode ? 'border-stone-800' : 'border-gray-200'}`}>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? darkMode ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600'
                  : darkMode ? 'border-transparent text-stone-400 hover:text-stone-200' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {currentData.unique.length === 0 ? (
          <div className="text-center py-12">
            <p className={darkMode ? 'text-stone-500' : 'text-gray-500'}>No {activeTab} to import</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentData.unique.map((item, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  currentSelected.has(index)
                    ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                    : darkMode ? 'border-stone-700 hover:border-stone-600' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleItem(index)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      currentSelected.has(index)
                        ? 'bg-blue-600 border-blue-600'
                        : darkMode ? 'border-stone-600' : 'border-gray-300'
                    }`}
                  >
                    {currentSelected.has(index) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <ItemDisplay item={item} type={activeTab} darkMode={darkMode} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDuplicates && currentData.duplicates.length > 0 && (
          <div className="mt-6">
            <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-stone-300' : 'text-gray-700'}`}>Duplicate Records</h4>
            <div className="space-y-3 opacity-60">
              {currentData.duplicates.map((item, index) => (
                <div
                  key={`dup-${index}`}
                  className={`p-4 border rounded-lg ${darkMode ? 'border-stone-700 bg-stone-800' : 'border-gray-200 bg-gray-50'}`}
                >
                  <ItemDisplay item={item} type={activeTab} darkMode={darkMode} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`p-6 border-t flex gap-3 ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-gray-50 border-gray-200'}`}>
        <button
          onClick={onClose}
          disabled={confirming}
          className={`flex-1 px-4 py-2 border rounded-lg font-medium transition-colors disabled:opacity-50 ${
            darkMode ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirming || totalSelected === 0}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {confirming ? 'Importing...' : `Import ${totalSelected} ${totalSelected === 1 ? 'Item' : 'Items'}`}
          {!confirming && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ItemDisplay({ item, type, darkMode = false }: { item: any; type: TabType; darkMode?: boolean }) {
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-stone-400' : 'text-gray-600';
  const badgeBg = darkMode ? 'bg-stone-800' : 'bg-gray-100';

  switch (type) {
    case 'conditions':
      return (
        <div>
          <p className={`font-medium ${textPrimary}`}>{item.name}</p>
          <div className={`flex items-center gap-4 mt-1 text-sm ${textSecondary}`}>
            {item.diagnosedOn && <span>Diagnosed: {item.diagnosedOn}</span>}
            {item.status && (
              <span className={`px-2 py-0.5 rounded text-xs ${badgeBg}`}>{item.status}</span>
            )}
          </div>
          {item.managingPhysician && (
            <p className={`text-sm mt-1 ${textSecondary}`}>Dr: {item.managingPhysician}</p>
          )}
        </div>
      );

    case 'medications':
      return (
        <div>
          <p className={`font-medium ${textPrimary}`}>{item.name}</p>
          <div className={`flex items-center gap-4 mt-1 text-sm ${textSecondary}`}>
            {item.dosage && <span>{item.dosage}</span>}
            {item.frequency && <span>{item.frequency}</span>}
          </div>
          {item.prescribedBy && (
            <p className={`text-sm mt-1 ${textSecondary}`}>Prescribed by: {item.prescribedBy}</p>
          )}
        </div>
      );

    case 'allergies':
      return (
        <div>
          <p className={`font-medium ${textPrimary}`}>{item.allergen}</p>
          <div className={`flex items-center gap-4 mt-1 text-sm ${textSecondary}`}>
            {item.reaction && <span>Reaction: {item.reaction}</span>}
            {item.severity && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                item.severity === 'Severe' ? 'bg-red-100 text-red-800' :
                item.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                'bg-green-100 text-green-800'
              }`}>
                {item.severity}
              </span>
            )}
          </div>
        </div>
      );

    case 'immunizations':
      return (
        <div>
          <p className={`font-medium ${textPrimary}`}>{item.vaccine}</p>
          <div className={`flex items-center gap-4 mt-1 text-sm ${textSecondary}`}>
            {item.administeredOn && <span>{item.administeredOn}</span>}
            {item.provider && <span>{item.provider}</span>}
          </div>
          {item.lotNumber && (
            <p className={`text-sm mt-1 ${textSecondary}`}>Lot: {item.lotNumber}</p>
          )}
        </div>
      );

    default:
      return <div className={textSecondary}>Unknown item type</div>;
  }
}
