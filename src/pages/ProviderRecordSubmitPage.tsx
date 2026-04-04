import { useState, useEffect, useRef } from 'react';
import {
  FileText, Upload, CheckCircle, AlertCircle, Clock, Shield,
  X, Plus, Loader2, FlaskConical, ScanLine, Microscope,
  Stethoscope, AlertTriangle,
} from 'lucide-react';

interface RequestDetails {
  id: string;
  patientName: string;
  providerName: string;
  doctorName?: string;
  recordTypes: string[];
  message?: string;
  urgency: string;
  status: string;
  expiresAt?: string;
  submittedAt?: string;
  files: any[];
}

interface FileEntry {
  id: string;
  file: File;
  recordKind: string;
  notes: string;
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

export default function ProviderRecordSubmitPage() {
  const [state, setState] = useState<'loading' | 'form' | 'submitting' | 'success' | 'error' | 'expired' | 'already_submitted'>('loading');
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [globalNotes, setGlobalNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const requestId = pathParts[1] || '';
  const token = new URLSearchParams(window.location.search).get('token') || '';

  useEffect(() => {
    loadRequest();
  }, []);

  const loadRequest = async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/record-request/${requestId}?token=${token}`,
        { headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );

      if (res.status === 410) {
        setState('expired');
        return;
      }
      if (res.status === 403) {
        setErrorMessage('This link is invalid or unauthorized.');
        setState('error');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error || 'Failed to load request');
        setState('error');
        return;
      }

      const data: RequestDetails = await res.json();
      setRequest(data);

      if (data.status === 'received' && data.submittedAt) {
        setState('already_submitted');
      } else {
        setState('form');
      }
    } catch {
      setErrorMessage('Failed to connect. Please try again.');
      setState('error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const defaultKind = request?.recordTypes?.[0] || 'OTHER';
    const newFiles: FileEntry[] = Array.from(selected).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      recordKind: defaultKind,
      notes: '',
    }));

    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileKind = (id: string, kind: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, recordKind: kind } : f));
  };

  const updateFileNotes = (id: string, notes: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, notes } : f));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setState('submitting');

    try {
      const filePayloads = await Promise.all(
        files.map(async (entry) => {
          const buffer = await entry.file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          return {
            fileName: entry.file.name,
            fileType: entry.file.name.split('.').pop() || 'pdf',
            contentType: entry.file.type || 'application/pdf',
            base64,
            recordKind: entry.recordKind,
            notes: entry.notes,
          };
        })
      );

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/record-request/${requestId}/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            files: filePayloads,
            providerNotes: globalNotes,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Submission failed');
      }

      setState('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit records');
      setState('form');
    }
  };

  if (state === 'loading') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-stone-400 animate-spin mb-4" />
          <p className="text-stone-500 text-sm">Loading request details...</p>
        </div>
      </PageShell>
    );
  }

  if (state === 'expired') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-5">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Request Expired</h2>
          <p className="text-stone-500 max-w-sm">
            This record request link has expired. Please contact the patient to send a new request.
          </p>
        </div>
      </PageShell>
    );
  }

  if (state === 'error') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Something Went Wrong</h2>
          <p className="text-stone-500 max-w-sm">{errorMessage}</p>
        </div>
      </PageShell>
    );
  }

  if (state === 'success') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-[scale-in_0.3s_ease-out]">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Records Sent Successfully</h2>
          <p className="text-stone-500 max-w-md mb-6">
            The records have been securely delivered to <strong>{request?.patientName}</strong>'s Health Vault.
            No further action is needed.
          </p>
          <div className="bg-stone-50 rounded-xl p-5 max-w-sm w-full text-left">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Submission Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Patient</span>
                <span className="text-sm font-medium text-stone-900">{request?.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Files Sent</span>
                <span className="text-sm font-medium text-stone-900">{files.length}</span>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (state === 'already_submitted') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Records Already Submitted</h2>
          <p className="text-stone-500 max-w-sm mb-6">
            Records for this request were submitted on{' '}
            <strong>{request?.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'a previous date'}</strong>.
          </p>
          <p className="text-stone-400 text-sm max-w-sm">
            If you need to send additional records, please ask the patient to create a new request.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-stone-100">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-stone-900">Record Request</h2>
              {request?.urgency === 'urgent' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  Urgent
                </span>
              )}
            </div>
            <p className="text-stone-500 text-sm">
              <strong>{request?.patientName}</strong> is requesting health records from your office.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-stone-50 rounded-xl p-5">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Requested Records</p>
              <div className="flex flex-wrap gap-2">
                {request?.recordTypes?.map(type => {
                  const cfg = KIND_CONFIG[type] || KIND_CONFIG.OTHER;
                  const Icon = cfg.icon;
                  return (
                    <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-sm font-medium text-stone-700">
                      <Icon className="w-3.5 h-3.5 text-stone-500" />
                      {cfg.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {request?.message && (
              <div className="bg-stone-50 rounded-xl p-5">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Message from Patient</p>
                <p className="text-sm text-stone-700 leading-relaxed">{request.message}</p>
              </div>
            )}

            {request?.expiresAt && (
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Clock className="w-3.5 h-3.5" />
                <span>This link expires {new Date(request.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}

            <div className="border-t border-stone-100 pt-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-4">Upload Records</h3>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="space-y-3 mb-4">
                  {files.map(entry => {
                    const ext = entry.file.name.split('.').pop()?.toUpperCase() || 'FILE';
                    return (
                      <div key={entry.id} className="border border-stone-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{entry.file.name}</p>
                            <p className="text-xs text-stone-400">
                              {ext} &middot; {(entry.file.size / 1024).toFixed(0)} KB
                            </p>
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Record Type</label>
                              <select
                                value={entry.recordKind}
                                onChange={e => updateFileKind(entry.id, e.target.value)}
                                className="w-full text-sm px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 outline-none focus:border-stone-400"
                              >
                                {Object.entries(KIND_CONFIG).map(([key, cfg]) => (
                                  <option key={key} value={key}>{cfg.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Notes (optional)</label>
                              <input
                                type="text"
                                value={entry.notes}
                                onChange={e => updateFileNotes(entry.id, e.target.value)}
                                placeholder="e.g. Blood panel from March visit"
                                className="w-full text-sm px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 outline-none focus:border-stone-400 placeholder-stone-300"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(entry.id)}
                            className="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 rounded-xl border-2 border-dashed border-stone-300 hover:border-stone-400 text-center transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-stone-200 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Plus className="w-6 h-6 text-stone-400 group-hover:text-stone-600" />
                </div>
                <p className="text-sm font-medium text-stone-700">Click to upload files</p>
                <p className="text-xs text-stone-400 mt-1">PDF, JPG, PNG, DOC accepted</p>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Additional Notes (optional)</label>
              <textarea
                value={globalNotes}
                onChange={e => setGlobalNotes(e.target.value)}
                rows={3}
                placeholder="Any additional context about these records..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-700 text-sm outline-none focus:border-stone-400 resize-none placeholder-stone-300"
              />
            </div>

            {errorMessage && state === 'form' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 border-t border-stone-100 bg-stone-50/50">
            <button
              onClick={handleSubmit}
              disabled={files.length === 0 || state === 'submitting'}
              className="w-full px-6 py-3.5 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {state === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Records...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit Records ({files.length} file{files.length !== 1 ? 's' : ''})
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-stone-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Files are encrypted in transit and stored securely</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <img
            src="/hv_logo-light.png"
            alt="Health Vault"
            className="w-9 h-9"
          />
          <div>
            <p className="text-sm font-semibold text-stone-900">Health Vault</p>
            <p className="text-xs text-stone-400">Secure Record Submission</p>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-stone-200 bg-white mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-stone-400">
            &copy; {new Date().getFullYear()} Health Vault. All rights reserved. HIPAA compliant.
          </p>
        </div>
      </footer>
    </div>
  );
}
