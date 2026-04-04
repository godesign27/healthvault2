import { useState, useRef, useEffect } from 'react';
import { X, Search, Building2, Send, ChevronRight, CheckCircle, Clock, FileText, FlaskConical, ScanLine, Microscope, Stethoscope, ArrowLeft, PenLine, Mail, AlertCircle } from 'lucide-react';
import { RecordKind } from '../../lib/records/types';
import { createRecordRequest } from '../../lib/records/requests-api';

interface RequestRecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSent?: () => void;
  darkMode?: boolean;
}

interface ProviderOption {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  address: string;
}

const MOCK_PROVIDERS: ProviderOption[] = [
  { id: '1', name: 'Dr. Sarah Chen', specialty: 'Internal Medicine', clinic: 'Springfield Medical Center', address: '123 Main St, Springfield, IL' },
  { id: '2', name: 'Dr. Michael Rivera', specialty: 'Cardiology', clinic: 'Heart Health Associates', address: '456 Oak Ave, Springfield, IL' },
  { id: '3', name: 'Dr. Emily Watson', specialty: 'Dermatology', clinic: 'Skin Care Clinic', address: '789 Elm St, Springfield, IL' },
  { id: '4', name: 'Dr. James Park', specialty: 'Orthopedics', clinic: 'Joint & Bone Specialists', address: '321 Pine Rd, Springfield, IL' },
  { id: '5', name: 'Dr. Lisa Thompson', specialty: 'Neurology', clinic: 'Brain & Spine Institute', address: '654 Maple Dr, Springfield, IL' },
  { id: '6', name: 'Springfield General Hospital', specialty: 'Hospital', clinic: 'Springfield General Hospital', address: '100 Hospital Blvd, Springfield, IL' },
  { id: '7', name: 'Midwest Imaging Center', specialty: 'Radiology', clinic: 'Midwest Imaging Center', address: '200 Diagnostic Way, Springfield, IL' },
  { id: '8', name: 'Premier Lab Services', specialty: 'Laboratory', clinic: 'Premier Lab Services', address: '50 Science Park, Springfield, IL' },
];

const RECORD_TYPES = [
  { kind: RecordKind.Lab, label: 'Lab Results', icon: FlaskConical, description: 'Blood work, urinalysis, cultures' },
  { kind: RecordKind.Imaging, label: 'Imaging & Scans', icon: ScanLine, description: 'X-rays, MRI, CT scans, ultrasounds' },
  { kind: RecordKind.Pathology, label: 'Pathology Reports', icon: Microscope, description: 'Biopsy results, tissue analysis' },
  { kind: RecordKind.SpecialistReport, label: 'Specialist Reports', icon: Stethoscope, description: 'Consultation notes, referral reports' },
  { kind: RecordKind.Other, label: 'Other Records', icon: FileText, description: 'Discharge summaries, visit notes, other' },
];

export function RequestRecordDrawer({ isOpen, onClose, onRequestSent, darkMode = false }: RequestRecordDrawerProps) {
  const [step, setStep] = useState<'provider' | 'details' | 'manual' | 'submitted'>('provider');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<RecordKind[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');
  const [submitting, setSubmitting] = useState(false);

  const [manualProviderName, setManualProviderName] = useState('');
  const [manualDoctorName, setManualDoctorName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [manualRecordTypes, setManualRecordTypes] = useState<RecordKind[]>([]);
  const [emailSent, setEmailSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInputRef.current?.focus(), 200);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const filteredProviders = MOCK_PROVIDERS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.clinic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRecordType = (kind: RecordKind) => {
    setSelectedTypes(prev =>
      prev.includes(kind) ? prev.filter(k => k !== kind) : [...prev, kind]
    );
  };

  const toggleManualRecordType = (kind: RecordKind) => {
    setManualRecordTypes(prev =>
      prev.includes(kind) ? prev.filter(k => k !== kind) : [...prev, kind]
    );
  };

  const handleSubmit = async () => {
    if (!selectedProvider) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await createRecordRequest({
        providerName: selectedProvider.clinic || selectedProvider.name,
        providerEmail: `records@${selectedProvider.clinic.toLowerCase().replace(/\s+/g, '')}.com`,
        doctorName: selectedProvider.name,
        recordTypes: selectedTypes,
        urgency,
        notes,
        dateRangeStart: dateFrom || undefined,
        dateRangeEnd: dateTo || undefined,
      });
      setEmailSent(result.emailSent);
      setStep('submitted');
      onRequestSent?.();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await createRecordRequest({
        providerName: manualProviderName,
        providerEmail: manualEmail,
        doctorName: manualDoctorName || undefined,
        recordTypes: manualRecordTypes,
        message: manualMessage || undefined,
      });
      setEmailSent(result.emailSent);
      setSelectedProvider({ id: 'manual', name: manualDoctorName || manualProviderName, specialty: '', clinic: manualProviderName, address: '' });
      setSelectedTypes(manualRecordTypes);
      setStep('submitted');
      onRequestSent?.();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetAll, 300);
  };

  const resetAll = () => {
    setStep('provider');
    setSearchQuery('');
    setSelectedProvider(null);
    setSelectedTypes([]);
    setDateFrom('');
    setDateTo('');
    setNotes('');
    setUrgency('routine');
    setManualProviderName('');
    setManualDoctorName('');
    setManualEmail('');
    setManualMessage('');
    setManualRecordTypes([]);
    setEmailSent(false);
    setSubmitError('');
  };

  const canSubmit = selectedProvider && selectedTypes.length > 0;
  const canSubmitManual = manualProviderName.trim() && manualEmail.trim() && manualRecordTypes.length > 0;

  if (!isOpen) return null;

  const inputClasses = `w-full px-4 py-3 rounded-lg border transition-colors ${
    darkMode
      ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500 focus:border-purple-500'
      : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-purple-500'
  } outline-none`;

  const labelClasses = `block text-sm font-medium mb-2 ${darkMode ? 'text-stone-300' : 'text-stone-700'}`;

  const isManualFlow = step === 'manual';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={handleClose}
      />
      <div className={`fixed right-0 top-0 h-full w-full max-w-xl z-50 ${
        darkMode ? 'bg-stone-900' : 'bg-white'
      } shadow-2xl transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {isManualFlow ? (
            <ManualEntryHeader darkMode={darkMode} onBack={() => setStep('provider')} onClose={handleClose} />
          ) : (
            <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  Request Health Record
                </h2>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  {step === 'provider' && 'Select a provider to request records from'}
                  {step === 'details' && `From ${selectedProvider?.name}`}
                  {step === 'submitted' && 'Your request has been sent'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {(step === 'provider' || step === 'details') && (
            <div className={`px-6 py-3 border-b ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}>
              <div className="flex items-center gap-3">
                <StepIndicator step={1} active={step === 'provider'} completed={step === 'details'} darkMode={darkMode} />
                <div className={`flex-1 h-px ${step === 'details' ? 'bg-purple-500' : darkMode ? 'bg-stone-700' : 'bg-stone-200'}`} />
                <StepIndicator step={2} active={step === 'details'} completed={false} darkMode={darkMode} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className={`text-xs ${step === 'provider' ? (darkMode ? 'text-white' : 'text-stone-900') : (darkMode ? 'text-stone-500' : 'text-stone-400')} font-medium`}>
                  Provider
                </span>
                <span className={`text-xs ${step === 'details' ? (darkMode ? 'text-white' : 'text-stone-900') : (darkMode ? 'text-stone-500' : 'text-stone-400')} font-medium`}>
                  Details
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {step === 'provider' && (
              <ProviderStep
                darkMode={darkMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchInputRef={searchInputRef}
                filteredProviders={filteredProviders}
                onSelectProvider={(provider) => {
                  setSelectedProvider(provider);
                  setStep('details');
                }}
                onManualEntry={() => setStep('manual')}
              />
            )}

            {step === 'details' && (
              <DetailsStep
                darkMode={darkMode}
                selectedProvider={selectedProvider}
                selectedTypes={selectedTypes}
                dateFrom={dateFrom}
                dateTo={dateTo}
                notes={notes}
                urgency={urgency}
                inputClasses={inputClasses}
                labelClasses={labelClasses}
                onChangeProvider={() => setStep('provider')}
                onToggleType={toggleRecordType}
                onSetDateFrom={setDateFrom}
                onSetDateTo={setDateTo}
                onSetNotes={setNotes}
                onSetUrgency={setUrgency}
              />
            )}

            {step === 'manual' && (
              <ManualEntryForm
                darkMode={darkMode}
                providerName={manualProviderName}
                doctorName={manualDoctorName}
                email={manualEmail}
                message={manualMessage}
                selectedTypes={manualRecordTypes}
                inputClasses={inputClasses}
                labelClasses={labelClasses}
                onSetProviderName={setManualProviderName}
                onSetDoctorName={setManualDoctorName}
                onSetEmail={setManualEmail}
                onSetMessage={setManualMessage}
                onToggleType={toggleManualRecordType}
              />
            )}

            {step === 'submitted' && (
              <SubmittedStep
                darkMode={darkMode}
                selectedProvider={selectedProvider}
                selectedTypes={selectedTypes}
                urgency={urgency}
                emailSent={emailSent}
                onClose={handleClose}
              />
            )}
          </div>

          {step === 'details' && (
            <div className={`px-6 py-4 border-t ${
              darkMode ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'
            }`}>
              {submitError && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-3 text-sm ${
                  darkMode ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('provider')}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
                    darkMode ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'manual' && (
            <div className={`px-6 py-4 border-t ${
              darkMode ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'
            }`}>
              {submitError && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-3 text-sm ${
                  darkMode ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}
              <button
                onClick={handleManualSubmit}
                disabled={!canSubmitManual || submitting}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ManualEntryHeader({ darkMode, onBack, onClose }: { darkMode: boolean; onBack: () => void; onClose: () => void }) {
  return (
    <div className={`sticky top-0 z-10 flex items-center gap-3 px-6 py-5 border-b ${
      darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
    }`}>
      <button
        onClick={onBack}
        className={`p-2 -ml-2 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
        }`}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
          Manual Request
        </h2>
        <p className={`text-sm mt-0.5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          Enter provider details to send a request
        </p>
      </div>
      <button
        onClick={onClose}
        className={`p-2 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
        }`}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function ProviderStep({ darkMode, searchQuery, setSearchQuery, searchInputRef, filteredProviders, onSelectProvider, onManualEntry }: {
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  filteredProviders: ProviderOption[];
  onSelectProvider: (p: ProviderOption) => void;
  onManualEntry: () => void;
}) {
  return (
    <div className="p-6">
      <div className="relative mb-4">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
          darkMode ? 'text-stone-500' : 'text-stone-400'
        }`} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by provider name, specialty, or clinic..."
          className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-colors ${
            darkMode
              ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500 focus:border-purple-500'
              : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-purple-500'
          } outline-none`}
        />
      </div>

      <div className="space-y-2">
        {filteredProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSelectProvider(provider)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all group ${
              darkMode
                ? 'border-stone-800 hover:border-purple-600 hover:bg-stone-800/60'
                : 'border-stone-100 hover:border-purple-500 hover:bg-purple-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                darkMode ? 'bg-stone-800 group-hover:bg-purple-900/30' : 'bg-stone-100 group-hover:bg-purple-100'
              } transition-colors`}>
                <Building2 className={`w-5 h-5 ${
                  darkMode ? 'text-stone-400 group-hover:text-purple-400' : 'text-stone-500 group-hover:text-purple-600'
                } transition-colors`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  {provider.name}
                </div>
                <div className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  {provider.specialty} -- {provider.clinic}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${
                darkMode ? 'text-stone-600 group-hover:text-purple-400' : 'text-stone-300 group-hover:text-purple-500'
              } transition-colors`} />
            </div>
          </button>
        ))}

        {filteredProviders.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
            <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No providers found</p>
            <p className="text-sm mt-1">Try a different search term or enter details manually</p>
          </div>
        )}
      </div>

      <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}>
        <button
          onClick={onManualEntry}
          className={`w-full p-4 rounded-xl border-2 border-dashed text-left transition-all group ${
            darkMode
              ? 'border-stone-700 hover:border-purple-600 hover:bg-stone-800/60'
              : 'border-stone-200 hover:border-purple-400 hover:bg-purple-50/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              darkMode ? 'bg-stone-800 group-hover:bg-purple-900/30' : 'bg-stone-100 group-hover:bg-purple-100'
            } transition-colors`}>
              <PenLine className={`w-5 h-5 ${
                darkMode ? 'text-stone-400 group-hover:text-purple-400' : 'text-stone-500 group-hover:text-purple-600'
              } transition-colors`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                Enter provider details manually
              </div>
              <div className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                Send a request via email to any provider
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${
              darkMode ? 'text-stone-600 group-hover:text-purple-400' : 'text-stone-300 group-hover:text-purple-500'
            } transition-colors`} />
          </div>
        </button>
      </div>
    </div>
  );
}

function ManualEntryForm({ darkMode, providerName, doctorName, email, message, selectedTypes, inputClasses, labelClasses, onSetProviderName, onSetDoctorName, onSetEmail, onSetMessage, onToggleType }: {
  darkMode: boolean;
  providerName: string;
  doctorName: string;
  email: string;
  message: string;
  selectedTypes: RecordKind[];
  inputClasses: string;
  labelClasses: string;
  onSetProviderName: (v: string) => void;
  onSetDoctorName: (v: string) => void;
  onSetEmail: (v: string) => void;
  onSetMessage: (v: string) => void;
  onToggleType: (k: RecordKind) => void;
}) {
  return (
    <div className="p-6 space-y-5">
      <div className={`p-4 rounded-xl flex items-start gap-3 ${
        darkMode ? 'bg-purple-900/15 border border-purple-800/30' : 'bg-purple-50 border border-purple-100'
      }`}>
        <Mail className={`w-5 h-5 mt-0.5 shrink-0 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
          We'll send a secure record request to the provider's email on your behalf.
        </p>
      </div>

      <div>
        <label className={labelClasses}>Provider / Facility Name *</label>
        <input
          type="text"
          value={providerName}
          onChange={(e) => onSetProviderName(e.target.value)}
          placeholder="e.g. Springfield Medical Center"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Doctor's Name</label>
        <input
          type="text"
          value={doctorName}
          onChange={(e) => onSetDoctorName(e.target.value)}
          placeholder="e.g. Dr. Sarah Chen"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Provider's Email Address *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => onSetEmail(e.target.value)}
          placeholder="records@provider.com"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Record Types *</label>
        <div className="grid grid-cols-1 gap-2">
          {RECORD_TYPES.map(({ kind, label, icon: Icon, description }) => {
            const selected = selectedTypes.includes(kind);
            return (
              <button
                key={kind}
                onClick={() => onToggleType(kind)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? darkMode
                      ? 'border-purple-600 bg-purple-900/20'
                      : 'border-purple-500 bg-purple-50'
                    : darkMode
                      ? 'border-stone-800 hover:border-stone-600'
                      : 'border-stone-100 hover:border-stone-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selected
                    ? darkMode ? 'bg-purple-900/40' : 'bg-purple-100'
                    : darkMode ? 'bg-stone-800' : 'bg-stone-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    selected
                      ? darkMode ? 'text-purple-400' : 'text-purple-600'
                      : darkMode ? 'text-stone-400' : 'text-stone-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    selected
                      ? darkMode ? 'text-purple-300' : 'text-purple-800'
                      : darkMode ? 'text-stone-200' : 'text-stone-800'
                  }`}>
                    {label}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {description}
                  </div>
                </div>
                {selected && (
                  <CheckCircle className={`w-5 h-5 shrink-0 ${
                    darkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClasses}>Message to Provider</label>
        <textarea
          value={message}
          onChange={(e) => onSetMessage(e.target.value)}
          rows={4}
          placeholder="Include any details that will help the provider locate your records, such as your date of birth, patient ID, or date range..."
          className={`${inputClasses} resize-none`}
        />
      </div>
    </div>
  );
}

function DetailsStep({ darkMode, selectedProvider, selectedTypes, dateFrom, dateTo, notes, urgency, inputClasses, labelClasses, onChangeProvider, onToggleType, onSetDateFrom, onSetDateTo, onSetNotes, onSetUrgency }: {
  darkMode: boolean;
  selectedProvider: ProviderOption | null;
  selectedTypes: RecordKind[];
  dateFrom: string;
  dateTo: string;
  notes: string;
  urgency: 'routine' | 'urgent';
  inputClasses: string;
  labelClasses: string;
  onChangeProvider: () => void;
  onToggleType: (k: RecordKind) => void;
  onSetDateFrom: (v: string) => void;
  onSetDateTo: (v: string) => void;
  onSetNotes: (v: string) => void;
  onSetUrgency: (v: 'routine' | 'urgent') => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className={`p-4 rounded-xl flex items-center gap-3 ${
        darkMode ? 'bg-stone-800' : 'bg-stone-50'
      }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
        }`}>
          <Building2 className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-stone-900'}`}>
            {selectedProvider?.name}
          </div>
          <div className={`text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            {selectedProvider?.clinic}
          </div>
        </div>
        <button
          onClick={onChangeProvider}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            darkMode ? 'text-purple-400 hover:bg-stone-700' : 'text-purple-600 hover:bg-purple-50'
          }`}
        >
          Change
        </button>
      </div>

      <div>
        <label className={labelClasses}>Record Types *</label>
        <div className="grid grid-cols-1 gap-2">
          {RECORD_TYPES.map(({ kind, label, icon: Icon, description }) => {
            const selected = selectedTypes.includes(kind);
            return (
              <button
                key={kind}
                onClick={() => onToggleType(kind)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? darkMode
                      ? 'border-purple-600 bg-purple-900/20'
                      : 'border-purple-500 bg-purple-50'
                    : darkMode
                      ? 'border-stone-800 hover:border-stone-600'
                      : 'border-stone-100 hover:border-stone-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selected
                    ? darkMode ? 'bg-purple-900/40' : 'bg-purple-100'
                    : darkMode ? 'bg-stone-800' : 'bg-stone-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    selected
                      ? darkMode ? 'text-purple-400' : 'text-purple-600'
                      : darkMode ? 'text-stone-400' : 'text-stone-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    selected
                      ? darkMode ? 'text-purple-300' : 'text-purple-800'
                      : darkMode ? 'text-stone-200' : 'text-stone-800'
                  }`}>
                    {label}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {description}
                  </div>
                </div>
                {selected && (
                  <CheckCircle className={`w-5 h-5 shrink-0 ${
                    darkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClasses}>Date Range (optional)</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs mb-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onSetDateFrom(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onSetDateTo(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Priority</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSetUrgency('routine')}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              urgency === 'routine'
                ? darkMode
                  ? 'border-purple-600 bg-purple-900/20'
                  : 'border-purple-500 bg-purple-50'
                : darkMode
                  ? 'border-stone-800 hover:border-stone-600'
                  : 'border-stone-100 hover:border-stone-300'
            }`}
          >
            <Clock className={`w-5 h-5 mx-auto mb-1 ${
              urgency === 'routine'
                ? darkMode ? 'text-purple-400' : 'text-purple-600'
                : darkMode ? 'text-stone-500' : 'text-stone-400'
            }`} />
            <div className={`text-sm font-medium ${
              urgency === 'routine'
                ? darkMode ? 'text-purple-300' : 'text-purple-800'
                : darkMode ? 'text-stone-300' : 'text-stone-600'
            }`}>Routine</div>
            <div className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>5-10 business days</div>
          </button>
          <button
            onClick={() => onSetUrgency('urgent')}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              urgency === 'urgent'
                ? darkMode
                  ? 'border-amber-600 bg-amber-900/20'
                  : 'border-amber-500 bg-amber-50'
                : darkMode
                  ? 'border-stone-800 hover:border-stone-600'
                  : 'border-stone-100 hover:border-stone-300'
            }`}
          >
            <Send className={`w-5 h-5 mx-auto mb-1 ${
              urgency === 'urgent'
                ? darkMode ? 'text-amber-400' : 'text-amber-600'
                : darkMode ? 'text-stone-500' : 'text-stone-400'
            }`} />
            <div className={`text-sm font-medium ${
              urgency === 'urgent'
                ? darkMode ? 'text-amber-300' : 'text-amber-800'
                : darkMode ? 'text-stone-300' : 'text-stone-600'
            }`}>Urgent</div>
            <div className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>1-3 business days</div>
          </button>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Additional Notes</label>
        <textarea
          value={notes}
          onChange={(e) => onSetNotes(e.target.value)}
          rows={3}
          placeholder="Any specific records or details the provider should know..."
          className={`${inputClasses} resize-none`}
        />
      </div>
    </div>
  );
}

function SubmittedStep({ darkMode, selectedProvider, selectedTypes, urgency, emailSent, onClose }: {
  darkMode: boolean;
  selectedProvider: ProviderOption | null;
  selectedTypes: RecordKind[];
  urgency: 'routine' | 'urgent';
  emailSent: boolean;
  onClose: () => void;
}) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
        darkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'
      }`}>
        <CheckCircle className={`w-8 h-8 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
      </div>
      <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
        Request Sent
      </h3>
      <p className={`text-sm max-w-xs mb-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
        Your request has been sent to <span className="font-medium">{selectedProvider?.name}</span>.
        You'll be notified when records are available.
      </p>
      {emailSent ? (
        <p className={`text-xs mb-6 flex items-center gap-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <Mail className="w-3.5 h-3.5" />
          Email delivered to provider
        </p>
      ) : (
        <p className={`text-xs mb-6 flex items-center gap-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          Request logged (email delivery pending)
        </p>
      )}
      <div className={`w-full max-w-sm p-4 rounded-xl text-left ${
        darkMode ? 'bg-stone-800' : 'bg-stone-50'
      }`}>
        <div className={`text-xs font-medium uppercase tracking-wider mb-3 ${
          darkMode ? 'text-stone-500' : 'text-stone-400'
        }`}>Request Summary</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Provider</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>{selectedProvider?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Records</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>{selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Priority</span>
            <span className={`text-sm font-medium capitalize ${
              urgency === 'urgent'
                ? darkMode ? 'text-amber-400' : 'text-amber-600'
                : darkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>{urgency}</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Est. Delivery</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {urgency === 'urgent' ? '1-3 business days' : '5-10 business days'}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="mt-6 px-8 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
      >
        Done
      </button>
    </div>
  );
}

function StepIndicator({ step, active, completed, darkMode }: { step: number; active: boolean; completed: boolean; darkMode: boolean }) {
  if (completed) {
    return (
      <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
    );
  }
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
      active
        ? 'bg-purple-600 text-white'
        : darkMode ? 'bg-stone-800 text-stone-500' : 'bg-stone-200 text-stone-400'
    }`}>
      {step}
    </div>
  );
}
