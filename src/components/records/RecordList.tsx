import { HealthRecord, RecordKind } from '../../lib/records/types';
import { RecordCard } from './RecordCard';
import { FileText } from 'lucide-react';

interface RecordListProps {
  records: HealthRecord[];
  darkMode?: boolean;
  currentFilter?: RecordKind | 'all';
  onRecordClick?: (record: HealthRecord) => void;
}

export function RecordList({ records, darkMode = false, currentFilter, onRecordClick }: RecordListProps) {
  if (records.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${
        darkMode ? 'text-stone-400' : 'text-stone-500'
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          darkMode ? 'bg-stone-800' : 'bg-stone-100'
        }`}>
          <FileText className="w-8 h-8" />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${
          darkMode ? 'text-stone-300' : 'text-stone-700'
        }`}>
          No records yet
        </h3>
        <p className="max-w-md">
          Try asking the assistant: "Upload a lab PDF" or "Connect my hospital portal"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          darkMode={darkMode}
          onClick={() => onRecordClick?.(record)}
        />
      ))}
    </div>
  );
}
