import { useState, useEffect, type MutableRefObject } from 'react';
import { Database, Upload, Link2, FileText, SendHorizontal as SendHorizonal } from 'lucide-react';
import { RecordList } from '../components/records/RecordList';
import { DocumentViewer } from '../components/records/DocumentViewer';
import { RequestRecordDrawer } from '../components/records/RequestRecordDrawer';
import { HealthRecord, RecordKind } from '../lib/records/types';
import { listRecords } from '../lib/records/query';
import { AIResultCard } from '../components/records/AIResultCard';

interface HealthRecordsPageProps {
  darkMode?: boolean;
  actionsRef?: MutableRefObject<{ openRequestRecords?: () => void }>;
}

export function HealthRecordsPage({ darkMode = false, actionsRef }: HealthRecordsPageProps) {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [currentFilter, setCurrentFilter] = useState<RecordKind | 'all'>('all');
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [stats, setStats] = useState({
    lastSynced: new Date().toLocaleDateString(),
    connectedProviders: 3,
    totalRecords: 0
  });

  useEffect(() => {
    if (actionsRef) {
      actionsRef.current = {
        openRequestRecords: () => setRequestDrawerOpen(true),
      };
    }
  }, [actionsRef]);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (currentFilter === 'all') {
      setFilteredRecords(records);
    } else {
      setFilteredRecords(records.filter(r => r.kind === currentFilter));
    }
  }, [records, currentFilter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await listRecords();
      setRecords(data);
      setStats(prev => ({ ...prev, totalRecords: data.length }));
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowInsight = (insight: any) => {
    setInsights(prev => [insight, ...prev]);
  };

  const filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Lab Results', value: RecordKind.Lab },
    { label: 'Imaging', value: RecordKind.Imaging },
    { label: 'Pathology', value: RecordKind.Pathology },
    { label: 'Specialist Reports', value: RecordKind.SpecialistReport },
    { label: 'Other', value: RecordKind.Other },
  ];

  return (
    <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            <FileText className="w-7 h-7" />
            Health Records
          </h1>
          <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
            Your labs, scans, and medical documents — all in one place.
          </p>
        </div>
        <button
          onClick={() => setRequestDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm shrink-0"
        >
          <SendHorizonal className="w-4 h-4" />
          Request Health Record
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-stone-900 text-white">
          <Database className="w-3.5 h-3.5" />
          Last Synced: {stats.lastSynced}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-stone-900 text-white">
          <Link2 className="w-3.5 h-3.5" />
          Connected Providers: {stats.connectedProviders}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-stone-900 text-white">
          <Upload className="w-3.5 h-3.5" />
          Total Records: {stats.totalRecords}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setCurrentFilter(filter.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentFilter === filter.value
                ? 'bg-emerald-600 text-white'
                : darkMode
                  ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="space-y-3 mb-6">
          {insights.map((insight) => (
            <AIResultCard
              key={insight.id}
              insight={insight}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className={`text-center ${
            darkMode ? 'text-stone-400' : 'text-stone-500'
          }`}>
            Loading records...
          </div>
        </div>
      ) : (
        <RecordList
          records={filteredRecords}
          darkMode={darkMode}
          currentFilter={currentFilter}
          onRecordClick={setSelectedRecord}
        />
      )}

      {selectedRecord && (
        <DocumentViewer
          record={selectedRecord}
          darkMode={darkMode}
          onClose={() => setSelectedRecord(null)}
          onRequestInsight={(recordId) => {
            console.log('Request insight for:', recordId);
          }}
        />
      )}

      <RequestRecordDrawer
        isOpen={requestDrawerOpen}
        onClose={() => setRequestDrawerOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
