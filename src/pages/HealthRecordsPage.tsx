import { useState, useEffect, type MutableRefObject } from 'react';
import { Database, Upload, Link2, FileText, SendHorizontal as SendHorizonal, Clock, CheckCircle, AlertCircle, Mail, Eye, Building2 } from 'lucide-react';
import { RecordList } from '../components/records/RecordList';
import { DocumentViewer } from '../components/records/DocumentViewer';
import { RequestRecordDrawer } from '../components/records/RequestRecordDrawer';
import { RecordRequestDetailDrawer } from '../components/records/RecordRequestDetailDrawer';
import { HealthRecord, RecordKind } from '../lib/records/types';
import { listRecords } from '../lib/records/query';
import { AIResultCard } from '../components/records/AIResultCard';
import { fetchRecordRequests, type RecordRequestRow } from '../lib/records/requests-api';

interface HealthRecordsPageProps {
  darkMode?: boolean;
  actionsRef?: MutableRefObject<{ openRequestRecords?: () => void }>;
  onConnectProvider?: () => void;
}

const KIND_LABELS: Record<string, string> = {
  LAB: 'Lab Results',
  IMAGING: 'Imaging',
  PATHOLOGY: 'Pathology',
  SPECIALIST_REPORT: 'Specialist',
  OTHER: 'Other',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export function HealthRecordsPage({ darkMode = false, actionsRef, onConnectProvider }: HealthRecordsPageProps) {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [currentFilter, setCurrentFilter] = useState<RecordKind | 'all'>('all');
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RecordRequestRow | null>(null);
  const [requests, setRequests] = useState<RecordRequestRow[]>([]);
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
    loadRequests();
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

  const loadRequests = async () => {
    try {
      const data = await fetchRecordRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load record requests:', err);
    }
  };

  const handleShowInsight = (insight: any) => {
    setInsights(prev => [insight, ...prev]);
  };

  const activeRequests = requests.filter(r => r.status !== 'received');
  const pendingCount = activeRequests.length;

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
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onConnectProvider}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Link2 className="w-4 h-4" />
            Connect Provider
          </button>
          <button
            onClick={() => setRequestDrawerOpen(true)}
            className={`relative inline-flex items-center gap-2 px-5 py-2.5 border rounded-xl font-medium transition-colors shadow-sm ${
              darkMode
                ? 'border-stone-700 text-stone-300 hover:bg-stone-800'
                : 'border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <SendHorizonal className="w-4 h-4" />
            Request Manually
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
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

      {requests.length > 0 && (
        <PendingRequestsSection
          requests={requests}
          darkMode={darkMode}
          onRequestClick={setSelectedRequest}
        />
      )}

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
        onRequestSent={loadRequests}
        darkMode={darkMode}
      />

      <RecordRequestDetailDrawer
        request={selectedRequest}
        darkMode={darkMode}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}

function StatusBadge({ status, darkMode }: { status: string; darkMode: boolean }) {
  switch (status) {
    case 'sent':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          darkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <Mail className="w-3 h-3" />
          Sent
        </span>
      );
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          darkMode ? 'bg-amber-900/40 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case 'received':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          darkMode ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <CheckCircle className="w-3 h-3" />
          Received
        </span>
      );
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          darkMode ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return null;
  }
}

function PendingRequestsSection({ requests, darkMode, onRequestClick }: { requests: RecordRequestRow[]; darkMode: boolean; onRequestClick: (req: RecordRequestRow) => void }) {
  const activeCount = requests.filter(r => r.status !== 'received').length;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${
          darkMode ? 'text-stone-400' : 'text-stone-500'
        }`}>
          Record Requests
        </h2>
        {activeCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
            {activeCount} active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {requests.map(req => (
          <button
            key={req.id}
            onClick={() => onRequestClick(req)}
            className={`rounded-xl border p-4 transition-all text-left cursor-pointer ${
              req.status === 'received'
                ? darkMode
                  ? 'border-emerald-800/50 bg-emerald-950/10 hover:border-emerald-700'
                  : 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 hover:shadow-sm'
                : darkMode
                  ? 'border-stone-700 bg-stone-900 hover:border-stone-600'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  req.status === 'received'
                    ? 'bg-emerald-100 text-emerald-600'
                    : req.status === 'sent'
                      ? darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                      : darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    {req.doctor_name || req.provider_name}
                  </p>
                  {req.doctor_name && (
                    <p className={`text-xs truncate ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                      {req.provider_name}
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge status={req.status} darkMode={darkMode} />
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {req.record_types?.map(type => (
                <span key={type} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
                }`}>
                  {KIND_LABELS[type] || type}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {timeAgo(req.created_at)}
              </span>
              {req.opened_at && req.status !== 'received' && (
                <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                  <Eye className="w-3 h-3" />
                  Opened
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
