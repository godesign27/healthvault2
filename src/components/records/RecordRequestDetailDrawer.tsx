import { useState, useEffect } from 'react';
import {
  X, Building2, Mail, Clock, CheckCircle, AlertCircle, Eye,
  FileText, FlaskConical, ScanLine, Microscope, Stethoscope,
  ExternalLink, Send, Copy, AlertTriangle, Loader2,
} from 'lucide-react';
import { type RecordRequestRow } from '../../lib/records/requests-api';

interface RecordRequestFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  record_kind: string;
  provider_notes: string | null;
  created_at: string;
}

interface RecordRequestDetailDrawerProps {
  request: RecordRequestRow | null;
  darkMode?: boolean;
  onClose: () => void;
  onResend?: (request: RecordRequestRow) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const KIND_CONFIG: Record<string, { label: string; icon: typeof FileText }> = {
  LAB: { label: 'Lab Results', icon: FlaskConical },
  IMAGING: { label: 'Imaging & Scans', icon: ScanLine },
  PATHOLOGY: { label: 'Pathology Reports', icon: Microscope },
  SPECIALIST_REPORT: { label: 'Specialist Reports', icon: Stethoscope },
  OTHER: { label: 'Other Records', icon: FileText },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordRequestDetailDrawer({ request, darkMode = false, onClose }: RecordRequestDetailDrawerProps) {
  const [files, setFiles] = useState<RecordRequestFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [copied, setCopied] = useState(false);
  const isOpen = !!request;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (request?.id) {
      loadFiles(request.id);
    } else {
      setFiles([]);
    }
  }, [request?.id]);

  const loadFiles = async (requestId: string) => {
    setLoadingFiles(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/record_request_files?request_id=eq.${requestId}&order=created_at.desc&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleCopyLink = async () => {
    if (!request) return;
    const link = `${window.location.origin}/record-request/${request.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!request) return null;

  const timeline = [
    { label: 'Request Created', time: request.created_at, icon: FileText, done: true },
    { label: 'Email Sent', time: request.status !== 'pending' ? request.created_at : null, icon: Send, done: request.status !== 'pending' },
    { label: 'Opened by Provider', time: request.opened_at, icon: Eye, done: !!request.opened_at },
    { label: 'Records Submitted', time: request.submitted_at, icon: CheckCircle, done: request.status === 'received' },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-40"
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full max-w-xl shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${darkMode ? 'bg-stone-900' : 'bg-white'}`}>
        <div className={`flex items-center justify-between px-6 py-5 border-b shrink-0 ${
          darkMode ? 'border-stone-700' : 'border-stone-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              request.status === 'received'
                ? 'bg-emerald-100 text-emerald-600'
                : request.status === 'sent'
                  ? darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  : darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-lg font-semibold truncate ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                {request.doctor_name || request.provider_name}
              </h2>
              {request.doctor_name && (
                <p className={`text-sm truncate ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  {request.provider_name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              darkMode ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <StatusSection request={request} darkMode={darkMode} />
            <RecordTypesSection request={request} darkMode={darkMode} />
            {request.message && <MessageSection message={request.message} darkMode={darkMode} />}
            <TimelineSection timeline={timeline} darkMode={darkMode} />

            {(files.length > 0 || loadingFiles) && (
              <SubmittedFilesSection files={files} loading={loadingFiles} darkMode={darkMode} />
            )}

            <DetailsSection request={request} darkMode={darkMode} />
          </div>
        </div>

        <div className={`px-6 py-4 border-t shrink-0 ${
          darkMode ? 'border-stone-700 bg-stone-900' : 'border-stone-200 bg-white'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={handleCopyLink}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                darkMode
                  ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={() => {
                const link = `${window.location.origin}/record-request/${request.id}`;
                window.open(link, '_blank');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                darkMode
                  ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              View Portal
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusSection({ request, darkMode }: { request: RecordRequestRow; darkMode: boolean }) {
  const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof CheckCircle }> = {
    sent: {
      label: 'Email Sent to Provider',
      color: darkMode ? 'text-blue-300' : 'text-blue-700',
      bgColor: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
      borderColor: darkMode ? 'border-blue-800' : 'border-blue-200',
      icon: Mail,
    },
    pending: {
      label: 'Pending',
      color: darkMode ? 'text-amber-300' : 'text-amber-700',
      bgColor: darkMode ? 'bg-amber-900/20' : 'bg-amber-50',
      borderColor: darkMode ? 'border-amber-800' : 'border-amber-200',
      icon: Clock,
    },
    received: {
      label: 'Records Received',
      color: darkMode ? 'text-emerald-300' : 'text-emerald-700',
      bgColor: darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50',
      borderColor: darkMode ? 'border-emerald-800' : 'border-emerald-200',
      icon: CheckCircle,
    },
    failed: {
      label: 'Delivery Failed',
      color: darkMode ? 'text-red-300' : 'text-red-700',
      bgColor: darkMode ? 'bg-red-900/20' : 'bg-red-50',
      borderColor: darkMode ? 'border-red-800' : 'border-red-200',
      icon: AlertCircle,
    },
  };

  const cfg = statusConfig[request.status] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${cfg.bgColor} ${cfg.borderColor}`}>
      <Icon className={`w-5 h-5 shrink-0 ${cfg.color}`} />
      <div>
        <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
        {request.status === 'sent' && !request.opened_at && (
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Waiting for provider to open the link
          </p>
        )}
        {request.status === 'sent' && request.opened_at && (
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            Provider opened the link -- awaiting file submission
          </p>
        )}
      </div>
      {request.urgency === 'urgent' && (
        <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
          darkMode ? 'bg-amber-900/40 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800 border border-amber-200'
        }`}>
          <AlertTriangle className="w-3 h-3" />
          Urgent
        </span>
      )}
    </div>
  );
}

function RecordTypesSection({ request, darkMode }: { request: RecordRequestRow; darkMode: boolean }) {
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
        darkMode ? 'text-stone-500' : 'text-stone-400'
      }`}>Requested Records</h3>
      <div className="flex flex-wrap gap-2">
        {request.record_types?.map(type => {
          const cfg = KIND_CONFIG[type] || KIND_CONFIG.OTHER;
          const Icon = cfg.icon;
          return (
            <span key={type} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
              darkMode
                ? 'bg-stone-800 text-stone-300 border border-stone-700'
                : 'bg-stone-50 text-stone-700 border border-stone-200'
            }`}>
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MessageSection({ message, darkMode }: { message: string; darkMode: boolean }) {
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
        darkMode ? 'text-stone-500' : 'text-stone-400'
      }`}>Message to Provider</h3>
      <div className={`p-4 rounded-xl border-l-3 ${
        darkMode ? 'bg-stone-800 border-stone-600' : 'bg-stone-50 border-stone-300'
      }`}>
        <p className={`text-sm leading-relaxed ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}

function TimelineSection({ timeline, darkMode }: { timeline: { label: string; time: string | null; icon: typeof FileText; done: boolean }[]; darkMode: boolean }) {
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
        darkMode ? 'text-stone-500' : 'text-stone-400'
      }`}>Timeline</h3>
      <div className="space-y-0">
        {timeline.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === timeline.length - 1;
          return (
            <div key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  step.done
                    ? 'bg-emerald-100 text-emerald-600'
                    : darkMode ? 'bg-stone-800 text-stone-600' : 'bg-stone-100 text-stone-300'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {!isLast && (
                  <div className={`w-px h-6 ${
                    step.done ? 'bg-emerald-200' : darkMode ? 'bg-stone-800' : 'bg-stone-200'
                  }`} />
                )}
              </div>
              <div className="pb-4">
                <p className={`text-sm font-medium ${
                  step.done
                    ? darkMode ? 'text-stone-200' : 'text-stone-800'
                    : darkMode ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  {step.label}
                </p>
                {step.time && step.done && (
                  <p className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {formatDate(step.time)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubmittedFilesSection({ files, loading, darkMode }: { files: RecordRequestFile[]; loading: boolean; darkMode: boolean }) {
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
        darkMode ? 'text-stone-500' : 'text-stone-400'
      }`}>Submitted Files</h3>
      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} />
          <span className={`text-sm ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Loading files...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => {
            const cfg = KIND_CONFIG[file.record_kind?.toUpperCase()] || KIND_CONFIG.OTHER;
            const Icon = cfg.icon;
            return (
              <div key={file.id} className={`flex items-start gap-3 p-3 rounded-xl ${
                darkMode ? 'bg-stone-800' : 'bg-stone-50'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  darkMode ? 'bg-stone-700' : 'bg-white border border-stone-200'
                }`}>
                  <Icon className={`w-4 h-4 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                    {file.file_name}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {file.file_type.toUpperCase()} &middot; {formatFileSize(file.file_size_bytes)}
                  </p>
                  {file.provider_notes && (
                    <p className={`text-xs mt-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                      {file.provider_notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailsSection({ request, darkMode }: { request: RecordRequestRow; darkMode: boolean }) {
  const rows = [
    { label: 'Provider Email', value: request.provider_email },
    { label: 'Patient Name', value: request.patient_name },
    { label: 'Urgency', value: request.urgency === 'urgent' ? 'Urgent' : 'Routine' },
    { label: 'Created', value: formatDate(request.created_at) },
    { label: 'Expires', value: formatDate(request.expires_at) },
  ];

  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
        darkMode ? 'text-stone-500' : 'text-stone-400'
      }`}>Request Details</h3>
      <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-stone-800' : 'bg-stone-50'}`}>
        {rows.map((row, i) => (
          <div key={row.label} className={`flex justify-between px-4 py-3 ${
            i < rows.length - 1 ? darkMode ? 'border-b border-stone-700' : 'border-b border-stone-100' : ''
          }`}>
            <span className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{row.label}</span>
            <span className={`text-sm font-medium text-right ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{row.value || '--'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
