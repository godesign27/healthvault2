import { useState, useEffect, useCallback } from 'react';
import {
  Search, ArrowLeft, CheckCircle, Link2, Globe, FileText, Loader2,
  Building2, ChevronRight, Shield, RefreshCw, AlertCircle, MapPin,
  Zap, X,
} from 'lucide-react';
import { searchProviderOrganizations } from '../../lib/tools/searchProviderOrganizations';
import { resolveProviderRecordConnection } from '../../lib/tools/resolveProviderRecordConnection';
import { startProviderConnection } from '../../lib/tools/startProviderConnection';
import { startEpicConnection } from '../../lib/tools/startEpicConnection';
import { fetchProviderRecordPreview } from '../../lib/tools/fetchProviderRecordPreview';
import { importMedicalRecords } from '../../lib/services/medical-import';
import { ImportReviewDialog } from '../import/ImportReviewDialog';
import { supabase } from '../../lib/supabase';
import type { ProviderConnectionStrategy } from '../../lib/provider-record-connection/types';

type FlowStep =
  | 'search'
  | 'resolving'
  | 'resolved'
  | 'connecting'
  | 'fetching'
  | 'review'
  | 'importing'
  | 'complete'
  | 'manual'
  | 'error';

interface OrgResult {
  id: string;
  name: string;
  ehrVendor: string | null;
  portalBrand: string | null;
  city: string | null;
  state: string | null;
  supportsDirectConnection: boolean;
  supportsEpicConnection: boolean;
  supportsManualRequest: boolean;
}

interface Resolution {
  strategy: ProviderConnectionStrategy;
  providerOrganization: { id: string; name: string } | null;
  existingConnection: { id: string; lastSyncedAt: string | null } | null;
  reason: string;
  nextAction: string;
}

interface ImportResults {
  conditions: number;
  medications: number;
  allergies: number;
  immunizations: number;
}

interface ProviderRecordConnectionFlowProps {
  onClose: () => void;
  onImportComplete?: (data: any) => void;
  onRefreshData?: () => Promise<void>;
  onOpenManualRequest?: () => void;
  darkMode?: boolean;
  initialProviderName?: string;
}

export function ProviderRecordConnectionFlow({
  onClose,
  onImportComplete,
  onRefreshData,
  onOpenManualRequest,
  darkMode = false,
  initialProviderName,
}: ProviderRecordConnectionFlowProps) {
  const [step, setStep] = useState<FlowStep>(initialProviderName ? 'resolving' : 'search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OrgResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgResult | null>(null);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [progressStage, setProgressStage] = useState(0);

  const getUserId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '00000000-0000-0000-0000-000000000000';
  }, []);

  useEffect(() => {
    if (initialProviderName) {
      handleResolveByName(initialProviderName);
    }
  }, [initialProviderName]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const result = await searchProviderOrganizations({ query: query.trim() });
      if (result.success && result.data?.organizations) {
        setSearchResults(result.data.organizations);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResolveByName = async (name: string) => {
    setStep('resolving');
    try {
      const userId = await getUserId();
      const result = await resolveProviderRecordConnection({
        userId,
        providerName: name,
      });
      if (result.success && result.data) {
        setResolution(result.data as Resolution);
        if (result.data.providerOrganization) {
          setSelectedOrg({
            id: result.data.providerOrganization.id,
            name: result.data.providerOrganization.name,
            ehrVendor: null,
            portalBrand: null,
            city: null,
            state: null,
            supportsDirectConnection: result.data.strategy === 'direct_provider_connection',
            supportsEpicConnection: result.data.strategy === 'epic_connection',
            supportsManualRequest: true,
          });
        }
        if (result.data.strategy === 'manual_fallback') {
          setStep('manual');
        } else {
          setStep('resolved');
        }
      } else {
        setStep('manual');
        setResolution(null);
      }
    } catch {
      setErrorMessage('Unable to determine connection path. You can still request records manually.');
      setStep('manual');
    }
  };

  const handleSelectOrg = async (org: OrgResult) => {
    setSelectedOrg(org);
    setStep('resolving');
    try {
      const userId = await getUserId();
      const result = await resolveProviderRecordConnection({
        userId,
        providerOrganizationId: org.id,
      });
      if (result.success && result.data) {
        setResolution(result.data as Resolution);
        if (result.data.strategy === 'manual_fallback') {
          setStep('manual');
        } else {
          setStep('resolved');
        }
      } else {
        setStep('manual');
      }
    } catch {
      setErrorMessage('Unable to determine connection path.');
      setStep('error');
    }
  };

  const handleConnect = async () => {
    if (!resolution || !selectedOrg) return;
    setStep('connecting');
    setProgressStage(0);
    try {
      const userId = await getUserId();
      let connectResult: any;

      if (resolution.strategy === 'direct_provider_connection') {
        connectResult = await startProviderConnection({
          userId,
          providerOrganizationId: selectedOrg.id,
        });
      } else if (resolution.strategy === 'epic_connection') {
        connectResult = await startEpicConnection({
          userId,
          providerOrganizationId: selectedOrg.id,
        });
      }

      if (connectResult?.success) {
        const status = connectResult.data?.status;
        if (status === 'not_configured' || status === 'not_supported') {
          setStep('fetching');
          await handleFetchPreview(selectedOrg.id, null);
        } else {
          setStep('fetching');
          await handleFetchPreview(
            selectedOrg.id,
            connectResult.data?.connectionId || null,
          );
        }
      } else {
        setStep('fetching');
        await handleFetchPreview(selectedOrg.id, null);
      }
    } catch {
      setErrorMessage('Connection could not be established. Fetching available preview data instead.');
      setStep('fetching');
      await handleFetchPreview(selectedOrg.id, null);
    }
  };

  const handleFetchFromExisting = async () => {
    if (!resolution?.existingConnection || !selectedOrg) return;
    setStep('fetching');
    await handleFetchPreview(
      selectedOrg.id,
      resolution.existingConnection.id,
    );
  };

  const handleFetchPreview = async (orgId: string, connectionId: string | null) => {
    setProgressStage(0);
    const stageTimer1 = setTimeout(() => setProgressStage(1), 800);
    const stageTimer2 = setTimeout(() => setProgressStage(2), 1800);

    try {
      const userId = await getUserId();
      const result = await fetchProviderRecordPreview({
        userId,
        providerOrganizationId: orgId,
        providerConnectionId: connectionId || undefined,
        strategy: resolution?.strategy || 'manual_fallback',
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      if (result.success && result.data?.itemsByType) {
        const transformed = transformPreviewToImportData(result.data.itemsByType);
        setImportData(transformed);
        setStep('review');
      } else {
        setErrorMessage(result.data?.message || result.error || 'No records available for preview.');
        setStep('error');
      }
    } catch {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setErrorMessage('Failed to retrieve records preview.');
      setStep('error');
    }
  };

  const handleImportConfirm = async (selectedData: any) => {
    setStep('importing');
    try {
      const results = await importMedicalRecords(selectedData);
      setImportResults(results);
      setStep('complete');
      if (onRefreshData) await onRefreshData();
      if (onImportComplete) onImportComplete(selectedData);
    } catch {
      setErrorMessage('Import failed. Please try again.');
      setStep('error');
    }
  };

  const handleManualRequest = () => {
    if (onOpenManualRequest) {
      onClose();
      onOpenManualRequest();
    }
  };

  const handleBack = () => {
    if (step === 'resolved' || step === 'manual' || step === 'error') {
      setStep('search');
      setResolution(null);
      setSelectedOrg(null);
    } else {
      onClose();
    }
  };

  const orgName = selectedOrg?.name || resolution?.providerOrganization?.name || 'your provider';

  return (
    <div className="flex flex-col h-full bg-white">
      <FlowHeader step={step} orgName={orgName} onBack={handleBack} onClose={onClose} />

      <div className="flex-1 overflow-y-auto">
        {step === 'search' && (
          <SearchStep
            query={searchQuery}
            onQueryChange={setSearchQuery}
            results={searchResults}
            searching={searching}
            onSelect={handleSelectOrg}
            onManual={handleManualRequest}
            darkMode={darkMode}
          />
        )}

        {step === 'resolving' && <ResolvingStep orgName={orgName} />}

        {step === 'resolved' && resolution && (
          <ResolvedStep
            resolution={resolution}
            orgName={orgName}
            onConnect={handleConnect}
            onFetchExisting={handleFetchFromExisting}
          />
        )}

        {step === 'connecting' && <ConnectingStep orgName={orgName} />}

        {step === 'fetching' && <FetchingStep orgName={orgName} stage={progressStage} />}

        {step === 'review' && importData && selectedOrg && (
          <ImportReviewDialog
            open={true}
            onClose={() => setStep('search')}
            connection={{ id: selectedOrg.id, name: orgName, fhirBaseUrl: '', patientId: '', scopes: [], context: 'medical' as const, userId: '', createdAt: '' }}
            data={importData}
            onConfirm={handleImportConfirm}
            darkMode={darkMode}
          />
        )}

        {step === 'importing' && <ImportingStep />}

        {step === 'complete' && importResults && (
          <CompleteStep results={importResults} orgName={orgName} onDone={onClose} />
        )}

        {step === 'manual' && (
          <ManualStep
            orgName={orgName}
            onManualRequest={handleManualRequest}
            onBack={() => { setStep('search'); setResolution(null); }}
            hasManualHandler={!!onOpenManualRequest}
          />
        )}

        {step === 'error' && (
          <ErrorStep
            message={errorMessage}
            onRetry={() => { setStep('search'); setResolution(null); }}
            onManual={handleManualRequest}
            hasManualHandler={!!onOpenManualRequest}
          />
        )}
      </div>
    </div>
  );
}

function FlowHeader({
  step,
  orgName,
  onBack,
  onClose,
}: {
  step: FlowStep;
  orgName: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const titles: Record<FlowStep, string> = {
    search: 'Connect Provider',
    resolving: 'Finding Connection',
    resolved: 'Connection Available',
    connecting: 'Connecting',
    fetching: 'Retrieving Records',
    review: 'Review Import',
    importing: 'Importing Records',
    complete: 'Import Complete',
    manual: 'Request Records',
    error: 'Connection Issue',
  };

  if (step === 'review') return null;

  return (
    <div className="p-6 border-b border-stone-200 flex items-center gap-3 flex-shrink-0">
      {step !== 'importing' && step !== 'complete' && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-stone-900 truncate">
          {titles[step]}
        </h3>
        {step !== 'search' && step !== 'complete' && step !== 'error' && (
          <p className="text-sm text-stone-500 truncate">{orgName}</p>
        )}
      </div>
      {step === 'search' && (
        <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-stone-100 transition-colors">
          <X className="w-5 h-5 text-stone-400" />
        </button>
      )}
    </div>
  );
}

function SearchStep({
  query,
  onQueryChange,
  results,
  searching,
  onSelect,
  onManual,
  darkMode,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  results: OrgResult[];
  searching: boolean;
  onSelect: (org: OrgResult) => void;
  onManual: () => void;
  darkMode?: boolean;
}) {
  return (
    <div className="p-6 space-y-5">
      <p className="text-sm text-stone-600 leading-relaxed">
        Search for your healthcare provider to import your medical records securely.
      </p>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Search by provider, hospital, or clinic..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoFocus
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent bg-white text-stone-900 placeholder:text-stone-400"
        />
      </div>

      {searching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-2">
          {results.map((org) => (
            <button
              key={org.id}
              onClick={() => onSelect(org)}
              className="w-full text-left p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-stone-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 text-sm">{org.name}</p>
                  {(org.city || org.ehrVendor) && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                      {org.city && org.state && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {org.city}, {org.state}
                        </span>
                      )}
                      {org.ehrVendor && <span>{org.ehrVendor}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {org.supportsDirectConnection && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <Zap className="w-3 h-3" /> Direct
                      </span>
                    )}
                    {org.supportsEpicConnection && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                        <Globe className="w-3 h-3" /> Portal
                      </span>
                    )}
                    {!org.supportsDirectConnection && !org.supportsEpicConnection && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                        <FileText className="w-3 h-3" /> Manual
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0 mt-3" />
              </div>
            </button>
          ))}
        </div>
      )}

      {!searching && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8 space-y-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 mx-auto">
            <Search className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-sm text-stone-500">No providers found for "{query}"</p>
          <button
            onClick={onManual}
            className="text-sm font-medium text-stone-700 hover:text-stone-900 underline underline-offset-2"
          >
            Request records manually instead
          </button>
        </div>
      )}

      {!searching && query.length < 2 && (
        <div className="pt-4 border-t border-stone-100">
          <button
            onClick={onManual}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-stone-300 hover:border-stone-400 hover:bg-stone-50 transition-all text-left"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0">
              <FileText className="w-5 h-5 text-stone-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Request records manually</p>
              <p className="text-xs text-stone-500 mt-0.5">Send a secure request to any provider</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function ResolvingStep({ orgName }: { orgName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
          <Shield className="w-8 h-8 text-stone-600" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
          <Loader2 className="w-4 h-4 text-stone-600 animate-spin" />
        </div>
      </div>
      <p className="text-sm font-medium text-stone-900 mb-1">Finding the best connection</p>
      <p className="text-xs text-stone-500 text-center max-w-xs">
        Checking available paths to securely connect to {orgName}
      </p>
    </div>
  );
}

function ResolvedStep({
  resolution,
  orgName,
  onConnect,
  onFetchExisting,
}: {
  resolution: Resolution;
  orgName: string;
  onConnect: () => void;
  onFetchExisting: () => void;
}) {
  const configs: Record<string, {
    icon: typeof CheckCircle;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    actionLabel: string;
    action: () => void;
  }> = {
    existing_connection: {
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      title: `Connected to ${orgName}`,
      description: resolution.existingConnection?.lastSyncedAt
        ? `Last synced ${new Date(resolution.existingConnection.lastSyncedAt).toLocaleDateString()}`
        : 'Active connection ready to fetch records',
      actionLabel: 'Check for Records',
      action: onFetchExisting,
    },
    direct_provider_connection: {
      icon: Link2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Secure connection available',
      description: `${orgName} supports a direct secure connection for importing your medical records.`,
      actionLabel: `Connect to ${orgName}`,
      action: onConnect,
    },
    epic_connection: {
      icon: Globe,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      title: 'Portal connection available',
      description: `${orgName} supports a secure patient portal connection for importing your records.`,
      actionLabel: 'Connect via Portal',
      action: onConnect,
    },
  };

  const config = configs[resolution.strategy];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-stone-200 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${config.iconBg} flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900">{config.title}</h4>
            <p className="text-sm text-stone-600 mt-1 leading-relaxed">{config.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50">
          <Shield className="w-4 h-4 text-stone-500 flex-shrink-0" />
          <p className="text-xs text-stone-600">
            Your data is encrypted and transferred securely. Health Vault never stores provider credentials.
          </p>
        </div>

        <button
          onClick={config.action}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-all hover:shadow-lg active:scale-[0.98]"
        >
          {config.actionLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ConnectingStep({ orgName }: { orgName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Link2 className="w-8 h-8 text-blue-600" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        </div>
      </div>
      <p className="text-sm font-medium text-stone-900 mb-1">Establishing secure connection</p>
      <p className="text-xs text-stone-500 text-center max-w-xs">
        Connecting to {orgName} with end-to-end encryption
      </p>
    </div>
  );
}

function FetchingStep({ orgName, stage }: { orgName: string; stage: number }) {
  const steps = [
    { label: 'Connected to provider', done: stage >= 1 },
    { label: 'Fetching available records', done: stage >= 2 },
    { label: 'Analyzing for duplicates', done: false },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-stone-600 animate-spin" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      <p className="text-sm font-medium text-stone-900 mb-6">Retrieving your records</p>

      <div className="w-full max-w-xs space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            {s.done ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : i === steps.findIndex(x => !x.done) ? (
              <Loader2 className="w-5 h-5 text-stone-500 animate-spin flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-stone-200 flex-shrink-0" />
            )}
            <span className={`text-sm ${s.done ? 'text-stone-700' : i === steps.findIndex(x => !x.done) ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-400 mt-6 text-center">
        Checking {orgName} for importable records
      </p>
    </div>
  );
}

function ImportingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-stone-900 mb-1">Importing records</p>
      <p className="text-xs text-stone-500 text-center max-w-xs">
        Saving selected records to your Health Vault
      </p>
    </div>
  );
}

function CompleteStep({
  results,
  orgName,
  onDone,
}: {
  results: ImportResults;
  orgName: string;
  onDone: () => void;
}) {
  const items = [
    { label: 'Conditions', count: results.conditions, dest: 'Medical Profile' },
    { label: 'Medications', count: results.medications, dest: 'Medical Profile / Care' },
    { label: 'Allergies', count: results.allergies, dest: 'Medical Profile' },
    { label: 'Immunizations', count: results.immunizations, dest: 'Medical Profile' },
  ].filter(i => i.count > 0);

  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-stone-900">Records Imported</h4>
          <p className="text-sm text-stone-600 mt-1">
            {total} {total === 1 ? 'record' : 'records'} from {orgName}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl border border-stone-200 divide-y divide-stone-100">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-stone-700">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-900">{item.count}</span>
                <span className="text-xs text-stone-400">in {item.dest}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-stone-500 text-center leading-relaxed">
        Your imported records are now available across Health Vault. Visit Medical Profile to review your updated health data.
      </p>

      <button
        onClick={onDone}
        className="w-full px-5 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-all"
      >
        Done
      </button>
    </div>
  );
}

function ManualStep({
  orgName,
  onManualRequest,
  onBack,
  hasManualHandler,
}: {
  orgName: string;
  onManualRequest: () => void;
  onBack: () => void;
  hasManualHandler: boolean;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-stone-200 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 flex-shrink-0">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900">Manual request needed</h4>
            <p className="text-sm text-stone-600 mt-1 leading-relaxed">
              We don't have a direct digital connection to {orgName} yet. You can request your records manually and we'll help you get them into Health Vault.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {hasManualHandler && (
            <button
              onClick={onManualRequest}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-all"
            >
              <FileText className="w-4 h-4" />
              Send Record Request
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full px-5 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-all"
          >
            Search for a different provider
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-stone-50">
        <AlertCircle className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-stone-600 leading-relaxed">
          Digital connections are being expanded regularly. Check back soon for direct access to more providers.
        </p>
      </div>
    </div>
  );
}

function ErrorStep({
  message,
  onRetry,
  onManual,
  hasManualHandler,
}: {
  message: string;
  onRetry: () => void;
  onManual: () => void;
  hasManualHandler: boolean;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center space-y-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-sm text-stone-700">{message}</p>
      </div>
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        {hasManualHandler && (
          <button
            onClick={onManual}
            className="w-full px-5 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-all"
          >
            Request records manually
          </button>
        )}
      </div>
    </div>
  );
}

function transformPreviewToImportData(itemsByType: Record<string, any[]>) {
  const transform = (items: any[] | undefined, type: string) => {
    if (!items) return { unique: [], duplicates: [], invalid: [] };
    const unique: any[] = [];
    const duplicates: any[] = [];
    for (const item of items) {
      const mapped = mapPreviewItem(item, type);
      if (item.isDuplicate) {
        duplicates.push(mapped);
      } else {
        unique.push(mapped);
      }
    }
    return { unique, duplicates, invalid: [] };
  };

  return {
    conditions: transform(itemsByType['condition'], 'condition'),
    medications: transform(itemsByType['medication'], 'medication'),
    allergies: transform(itemsByType['allergy'], 'allergy'),
    immunizations: transform(itemsByType['immunization'], 'immunization'),
  };
}

function mapPreviewItem(item: any, type: string) {
  switch (type) {
    case 'condition':
      return {
        name: item.name,
        diagnosedOn: item.date,
        status: item.status || 'Active',
        managingPhysician: item.source,
      };
    case 'medication':
      return {
        name: item.name,
        dosage: extractDosage(item.name),
        frequency: null,
        prescribedBy: item.source,
      };
    case 'allergy':
      return {
        allergen: item.name,
        reaction: null,
        severity: null,
      };
    case 'immunization':
      return {
        vaccine: item.name,
        administeredOn: item.date,
        provider: item.source,
        lotNumber: null,
      };
    default:
      return item;
  }
}

function extractDosage(name: string): string | null {
  const match = name.match(/\d+\s*mg|\d+\s*mcg|\d+\s*ml/i);
  return match ? match[0] : null;
}
