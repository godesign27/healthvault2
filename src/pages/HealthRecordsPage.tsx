import { useState, useEffect, useCallback, type MutableRefObject } from 'react';
import { Database, Upload, Link2, FileText, SendHorizontal as SendHorizonal, Clock, CheckCircle, AlertCircle, Mail, Eye, Building2, ArrowRight, X } from 'lucide-react';
import { RecordList } from '../components/records/RecordList';
import { DocumentViewer } from '../components/records/DocumentViewer';
import { RequestRecordDrawer } from '../components/records/RequestRecordDrawer';
import { RecordRequestDetailDrawer } from '../components/records/RecordRequestDetailDrawer';
import { HealthRecord, RecordKind } from '../lib/records/types';
import { listRecords } from '../lib/records/query';
import { fetchRecordRequests, type RecordRequestRow } from '../lib/records/requests-api';
import { supabase } from '../lib/supabase';

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
  const [loading, setLoading] = useState(true);
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RecordRequestRow | null>(null);
  const [requests, setRequests] = useState<RecordRequestRow[]>([]);
  const [stats, setStats] = useState({
    lastSynced: 'Never',
    connectedProviders: 0,
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
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });
      if (!res.ok) return;
      const s = await res.json();
      setStats(prev => ({
        ...prev,
        connectedProviders: s.connectedProviders ?? 0,
        lastSynced: s.lastSyncedAt
          ? new Date(s.lastSyncedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Never',
      }));
    } catch {
      /* non-blocking */
    }
  };

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

  const loadRequests = useCallback(async () => {
    try {
      const data = await fetchRecordRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load record requests:', err);
    }
  }, []);

  const handleRequestUpdated = useCallback((updated: RecordRequestRow) => {
    setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    if (updated.status === 'received') {
      loadRecords();
    }
  }, []);

  const activeRequests = requests.filter(r => r.status !== 'received');
  const receivedRequests = requests.filter(r => r.status === 'received');
  const pendingCount = activeRequests.length;
  const [dismissedReceived, setDismissedReceived] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissedRecordBanners');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    if (dismissedReceived.size > 0) {
      localStorage.setItem('dismissedRecordBanners', JSON.stringify([...dismissedReceived]));
    }
  }, [dismissedReceived]);

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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-content-primary">
            <FileText className="w-7 h-7 shrink-0" />
            Health Records
          </h1>
          <p className="text-content-secondary">
            Your labs, scans, and medical documents — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onConnectProvider}
            className="inline-flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-action-primary text-content-on-action rounded-xl font-medium hover:bg-action-primary-hover transition-colors shadow-sm"
          >
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Connect Provider</span>
          </button>
          <button
            onClick={() => setRequestDrawerOpen(true)}
            className="relative inline-flex items-center gap-2 px-3 sm:px-5 py-2.5 border border-stroke-default rounded-xl font-medium text-content-secondary transition-colors shadow-sm hover:bg-action-secondary"
          >
            <SendHorizonal className="w-4 h-4" />
            <span className="hidden sm:inline">Request Manually</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-hv-orange-500 text-content-on-action text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-action-primary text-content-on-action">
          <Database className="w-3.5 h-3.5" />
          Last Synced: {stats.lastSynced}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-action-primary text-content-on-action">
          <Link2 className="w-3.5 h-3.5" />
          Connected Providers: {stats.connectedProviders}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-action-primary text-content-on-action">
          <Upload className="w-3.5 h-3.5" />
          Total Records: {stats.totalRecords}
        </div>
      </div>

      {receivedRequests.filter(r => !dismissedReceived.has(r.id)).length > 0 && (
        <ReceivedRecordsBanner
          requests={receivedRequests.filter(r => !dismissedReceived.has(r.id))}
          darkMode={darkMode}
          onDismiss={(id) => setDismissedReceived(prev => new Set(prev).add(id))}
          onViewRecord={(req) => setSelectedRequest(req)}
        />
      )}

      {activeRequests.length > 0 && (
        <PendingRequestsSection
          requests={activeRequests}
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
                ? 'bg-emerald-600 text-content-on-action'
                : 'bg-surface-sunken text-content-secondary hover:bg-action-secondary'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center text-content-tertiary">
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
        onClose={() => {
          setSelectedRequest(null);
          loadRequests();
          loadRecords();
        }}
        onDelete={(deletedId) => {
          setRequests(prev => prev.filter(r => r.id !== deletedId));
          setSelectedRequest(null);
        }}
        onRequestUpdated={handleRequestUpdated}
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
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          Pending Requests
        </h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-hv-orange-500 text-content-on-action">
          {requests.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {requests.map(req => (
          <button
            key={req.id}
            onClick={() => onRequestClick(req)}
            className={`p-4 text-left transition-all cursor-pointer ${
              req.status === 'received'
                ? darkMode
                  ? 'rounded-xl border border-emerald-800/50 bg-emerald-950/10 hover:border-emerald-700'
                  : 'rounded-xl border border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 hover:shadow-sm'
                : 'hv-surface-card hv-surface-card--interactive hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  req.status === 'received'
                    ? 'bg-emerald-100 text-emerald-600'
                    : req.status === 'sent'
                      ? darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                      : 'bg-surface-sunken text-content-tertiary'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-content-primary">
                    {req.doctor_name || req.provider_name}
                  </p>
                  {req.doctor_name && (
                    <p className="text-xs truncate text-content-tertiary">
                      {req.provider_name}
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge status={req.status} darkMode={darkMode} />
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {req.record_types?.map(type => (
                <span key={type} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-sunken text-content-tertiary">
                  {KIND_LABELS[type] || type}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-content-tertiary">
                {timeAgo(req.created_at)}
              </span>
              {req.opened_at && req.status !== 'received' && (
                <span className="flex items-center gap-1 text-xs text-content-tertiary">
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

function ReceivedRecordsBanner({ requests, darkMode, onDismiss, onViewRecord }: {
  requests: RecordRequestRow[];
  darkMode: boolean;
  onDismiss: (id: string) => void;
  onViewRecord: (req: RecordRequestRow) => void;
}) {
  return (
    <div className="mb-6 space-y-3">
      {requests.map(req => (
        <div
          key={req.id}
          className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
            darkMode
              ? 'bg-emerald-950/20 border-emerald-800/50'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            darkMode ? 'bg-emerald-900/40' : 'bg-emerald-100'
          }`}>
            <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
              Records received from {req.doctor_name || req.provider_name}
            </p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
              {req.record_types?.map(t => KIND_LABELS[t] || t).join(', ')} -- now available in your records
            </p>
          </div>
          <button
            onClick={() => onViewRecord(req)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              darkMode
                ? 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            View
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDismiss(req.id)}
            className={`shrink-0 p-1.5 rounded-lg transition-colors ${
              darkMode ? 'text-emerald-500 hover:bg-emerald-900/40' : 'text-emerald-400 hover:bg-emerald-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
