import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, Building2, Send, ChevronRight, CheckCircle, Clock, FileText, FlaskConical, ScanLine, Microscope, Stethoscope, ArrowLeft, PenLine, Mail, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { RecordKind } from '../../lib/records/types';
import { createRecordRequest } from '../../lib/records/requests-api';
import { supabase } from '../../lib/supabase';

interface PatientProfileSnapshot {
  dateOfBirth: string;
  phone: string;
  email: string;
}

async function fetchPatientProfile(): Promise<PatientProfileSnapshot> {
  const result: PatientProfileSnapshot = { dateOfBirth: '', phone: '', email: '' };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return result;

    const { data } = await supabase
      .from('user_profiles')
      .select('date_of_birth, phone, email')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (data) {
      result.dateOfBirth = data.date_of_birth || '';
      result.phone = data.phone || '';
      result.email = data.email || session.user.email || '';
    }
  } catch {}
  return result;
}

async function saveProfileFields(fields: Partial<PatientProfileSnapshot>): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const update: Record<string, string> = {};
    if (fields.dateOfBirth) update.date_of_birth = fields.dateOfBirth;
    if (fields.phone) update.phone = fields.phone;
    if (fields.email) update.email = fields.email;
    if (Object.keys(update).length === 0) return true;

    const { error } = await supabase
      .from('user_profiles')
      .update(update)
      .eq('user_id', session.user.id);

    return !error;
  } catch {
    return false;
  }
}

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
  const [emailError, setEmailError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [profile, setProfile] = useState<PatientProfileSnapshot>({ dateOfBirth: '', phone: '', email: '' });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editDob, setEditDob] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !profileLoaded) {
      fetchPatientProfile().then(p => {
        setProfile(p);
        setEditDob(p.dateOfBirth);
        setEditPhone(p.phone);
        setEditEmail(p.email);
        setProfileLoaded(true);
      });
    }
  }, [isOpen, profileLoaded]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInputRef.current?.focus(), 200);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const missingFields = profileLoaded && (!editDob || !editPhone || !editEmail);

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

  const saveProfileIfNeeded = async () => {
    const updates: Partial<PatientProfileSnapshot> = {};
    if (editDob && editDob !== profile.dateOfBirth) updates.dateOfBirth = editDob;
    if (editPhone && editPhone !== profile.phone) updates.phone = editPhone;
    if (editEmail && editEmail !== profile.email) updates.email = editEmail;
    if (Object.keys(updates).length > 0) {
      await saveProfileFields(updates);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProvider) return;
    if (!editDob || !editPhone || !editEmail) {
      setSubmitError('Please complete your identity information before sending.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await saveProfileIfNeeded();
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
      setEmailError(result.emailError || '');
      setStep('submitted');
      onRequestSent?.();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!editDob || !editPhone || !editEmail) {
      setSubmitError('Please complete your identity information before sending.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await saveProfileIfNeeded();
      const result = await createRecordRequest({
        providerName: manualProviderName,
        providerEmail: manualEmail,
        doctorName: manualDoctorName || undefined,
        recordTypes: manualRecordTypes,
        message: manualMessage || undefined,
      });
      setEmailSent(result.emailSent);
      setEmailError(result.emailError || '');
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
    setEmailError('');
    setSubmitError('');
    setProfileLoaded(false);
  };

  const canSubmit = selectedProvider && selectedTypes.length > 0;
  const canSubmitManual = manualProviderName.trim() && manualEmail.trim() && manualRecordTypes.length > 0;

  if (!isOpen) return null;

  const inputClasses = `w-full px-4 py-3 rounded-lg border transition-colors ${
    darkMode
      ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder focus:border-purple-500'
      : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder focus:border-purple-500'
  } outline-none`;

  const labelClasses = `block text-sm font-medium mb-2 ${darkMode ? 'text-content-primary' : 'text-content-primary'}`;

  const isManualFlow = step === 'manual';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={handleClose}
      />
      <div className={`fixed right-0 top-0 h-full w-full max-w-xl z-50 hv-surface-card-bg shadow-2xl transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {isManualFlow ? (
            <ManualEntryHeader darkMode={darkMode} onBack={() => setStep('provider')} onClose={handleClose} />
          ) : (
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-stroke-subtle hv-surface-card-bg">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                  Request Health Record
                </h2>
                <p className={`text-sm mt-0.5 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                  {step === 'provider' && 'Select a provider to request records from'}
                  {step === 'details' && `From ${selectedProvider?.name}`}
                  {step === 'submitted' && 'Your request has been sent'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-surface-sunken text-content-secondary' : 'hover:bg-surface-sunken text-content-secondary'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {(step === 'provider' || step === 'details') && (
            <div className={`px-6 py-3 border-b ${darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'}`}>
              <div className="flex items-center gap-3">
                <StepIndicator step={1} active={step === 'provider'} completed={step === 'details'} darkMode={darkMode} />
                <div className={`flex-1 h-px ${step === 'details' ? 'bg-purple-500' : darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'}`} />
                <StepIndicator step={2} active={step === 'details'} completed={false} darkMode={darkMode} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className={`text-xs ${step === 'provider' ? (darkMode ? 'text-white' : 'text-content-primary') : (darkMode ? 'text-content-secondary' : 'text-content-secondary')} font-medium`}>
                  Provider
                </span>
                <span className={`text-xs ${step === 'details' ? (darkMode ? 'text-white' : 'text-content-primary') : (darkMode ? 'text-content-secondary' : 'text-content-secondary')} font-medium`}>
                  Details
                </span>
              </div>
            </div>
          )}

          {step === 'provider' && (
            <div className="flex-1 overflow-hidden">
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
            </div>
          )}

          <div className={`flex-1 overflow-y-auto ${step === 'provider' ? 'hidden' : ''}`}>
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
                profileLoaded={profileLoaded}
                editDob={editDob}
                editPhone={editPhone}
                editEmail={editEmail}
                onSetDob={setEditDob}
                onSetPhone={setEditPhone}
                onSetEmail={setEditEmail}
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
                urgency={urgency}
                inputClasses={inputClasses}
                labelClasses={labelClasses}
                onSetProviderName={setManualProviderName}
                onSetDoctorName={setManualDoctorName}
                onSetEmail={setManualEmail}
                onSetMessage={setManualMessage}
                onToggleType={toggleManualRecordType}
                onSetUrgency={setUrgency}
                profileLoaded={profileLoaded}
                editDob={editDob}
                editPhone={editPhone}
                editEmail={editEmail}
                onSetDob={setEditDob}
                onSetPhone={setEditPhone}
                onSetPatientEmail={setEditEmail}
              />
            )}

            {step === 'submitted' && (
              <SubmittedStep
                darkMode={darkMode}
                selectedProvider={selectedProvider}
                selectedTypes={selectedTypes}
                urgency={urgency}
                emailSent={emailSent}
                emailError={emailError}
                onClose={handleClose}
              />
            )}
          </div>

          {step === 'details' && (
            <div className="px-6 py-4 border-t border-stroke-subtle hv-surface-card-bg">
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
                    darkMode ? 'bg-surface-sunken text-content-primary hover:bg-surface-sunken' : 'bg-surface-sunken text-content-primary hover:bg-surface-overlay'
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
            <div className="px-6 py-4 border-t border-stroke-subtle hv-surface-card-bg">
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
    <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-5 border-b border-stroke-subtle hv-surface-card-bg">
      <button
        onClick={onBack}
        className={`p-2 -ml-2 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-surface-sunken text-content-secondary' : 'hover:bg-surface-sunken text-content-secondary'
        }`}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-content-primary'}`}>
          Manual Request
        </h2>
        <p className={`text-sm mt-0.5 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
          Enter provider details to send a request
        </p>
      </div>
      <button
        onClick={onClose}
        className={`p-2 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-surface-sunken text-content-secondary' : 'hover:bg-surface-sunken text-content-secondary'
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 pb-0">
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by provider name, specialty, or clinic..."
          className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-colors ${
            darkMode
              ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder focus:border-purple-500'
              : 'bg-surface-sunken border-stroke-subtle text-content-primary placeholder:text-content-placeholder focus:border-purple-500'
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
                ? 'border-stroke-subtle hover:border-purple-600 hover:bg-surface-sunken/60'
                : 'border-stroke-subtle hover:border-purple-500 hover:bg-purple-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                darkMode ? 'bg-surface-sunken group-hover:bg-purple-900/30' : 'bg-surface-sunken group-hover:bg-purple-100'
              } transition-colors`}>
                <Building2 className={`w-5 h-5 ${
                  darkMode ? 'text-content-secondary group-hover:text-purple-400' : 'text-content-secondary group-hover:text-purple-600'
                } transition-colors`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                  {provider.name}
                </div>
                <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                  {provider.specialty} -- {provider.clinic}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${
                darkMode ? 'text-content-secondary group-hover:text-purple-400' : 'text-content-primary group-hover:text-purple-500'
              } transition-colors`} />
            </div>
          </button>
        ))}

        {filteredProviders.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
            <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No providers found</p>
            <p className="text-sm mt-1">Try a different search term or enter details manually</p>
          </div>
        )}
      </div>

      </div>

      <div className="shrink-0 px-6 py-4 border-t border-stroke-subtle hv-surface-card-bg">
        <button
          onClick={onManualEntry}
          className={`w-full p-4 rounded-xl border-2 border-dashed text-left transition-all group ${
            darkMode
              ? 'border-stroke-default hover:border-stroke-strong hover:bg-surface-sunken/60'
              : 'border-stroke-subtle hover:border-stroke-strong hover:bg-surface-sunken'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              darkMode ? 'bg-surface-sunken group-hover:bg-surface-sunken' : 'bg-surface-sunken group-hover:bg-surface-overlay'
            } transition-colors`}>
              <PenLine className={`w-5 h-5 ${
                darkMode ? 'text-content-secondary' : 'text-content-secondary'
              } transition-colors`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-content-primary'}`}>
                Enter provider details manually
              </div>
              <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
                Send a request via email to any provider
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${
              darkMode ? 'text-content-secondary' : 'text-content-primary'
            } transition-colors`} />
          </div>
        </button>
      </div>
    </div>
  );
}

function ManualEntryForm({ darkMode, providerName, doctorName, email, message, selectedTypes, urgency, inputClasses, labelClasses, onSetProviderName, onSetDoctorName, onSetEmail, onSetMessage, onToggleType, onSetUrgency, profileLoaded, editDob, editPhone, editEmail, onSetDob, onSetPhone, onSetPatientEmail }: {
  darkMode: boolean;
  providerName: string;
  doctorName: string;
  email: string;
  message: string;
  selectedTypes: RecordKind[];
  urgency: 'routine' | 'urgent';
  inputClasses: string;
  labelClasses: string;
  onSetProviderName: (v: string) => void;
  onSetDoctorName: (v: string) => void;
  onSetEmail: (v: string) => void;
  onSetMessage: (v: string) => void;
  onToggleType: (k: RecordKind) => void;
  onSetUrgency: (v: 'routine' | 'urgent') => void;
  profileLoaded: boolean;
  editDob: string;
  editPhone: string;
  editEmail: string;
  onSetDob: (v: string) => void;
  onSetPhone: (v: string) => void;
  onSetPatientEmail: (v: string) => void;
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
                      ? 'border-stroke-subtle hover:border-stroke-default'
                      : 'border-stroke-subtle hover:border-stroke-default'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selected
                    ? darkMode ? 'bg-purple-900/40' : 'bg-purple-100'
                    : darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    selected
                      ? darkMode ? 'text-purple-400' : 'text-purple-600'
                      : darkMode ? 'text-content-secondary' : 'text-content-secondary'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    selected
                      ? darkMode ? 'text-purple-300' : 'text-purple-800'
                      : darkMode ? 'text-content-primary' : 'text-content-primary'
                  }`}>
                    {label}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
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
                  ? 'border-stroke-subtle hover:border-stroke-default'
                  : 'border-stroke-subtle hover:border-stroke-default'
            }`}
          >
            <Clock className={`w-5 h-5 mx-auto mb-1 ${
              urgency === 'routine'
                ? darkMode ? 'text-purple-400' : 'text-purple-600'
                : darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`} />
            <div className={`text-sm font-medium ${
              urgency === 'routine'
                ? darkMode ? 'text-purple-300' : 'text-purple-800'
                : darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>Routine</div>
            <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>5-10 business days</div>
          </button>
          <button
            onClick={() => onSetUrgency('urgent')}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              urgency === 'urgent'
                ? darkMode
                  ? 'border-amber-600 bg-amber-900/20'
                  : 'border-amber-500 bg-amber-50'
                : darkMode
                  ? 'border-stroke-subtle hover:border-stroke-default'
                  : 'border-stroke-subtle hover:border-stroke-default'
            }`}
          >
            <Send className={`w-5 h-5 mx-auto mb-1 ${
              urgency === 'urgent'
                ? darkMode ? 'text-amber-400' : 'text-amber-600'
                : darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`} />
            <div className={`text-sm font-medium ${
              urgency === 'urgent'
                ? darkMode ? 'text-amber-300' : 'text-amber-800'
                : darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>Urgent</div>
            <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>1-3 business days</div>
          </button>
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

      <IdentityVerificationCard
        darkMode={darkMode}
        profileLoaded={profileLoaded}
        editDob={editDob}
        editPhone={editPhone}
        editEmail={editEmail}
        onSetDob={onSetDob}
        onSetPhone={onSetPhone}
        onSetEmail={onSetPatientEmail}
        inputClasses={inputClasses}
      />
    </div>
  );
}

function DetailsStep({ darkMode, selectedProvider, selectedTypes, dateFrom, dateTo, notes, urgency, inputClasses, labelClasses, onChangeProvider, onToggleType, onSetDateFrom, onSetDateTo, onSetNotes, onSetUrgency, profileLoaded, editDob, editPhone, editEmail, onSetDob, onSetPhone, onSetEmail }: {
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
  profileLoaded: boolean;
  editDob: string;
  editPhone: string;
  editEmail: string;
  onSetDob: (v: string) => void;
  onSetPhone: (v: string) => void;
  onSetEmail: (v: string) => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className={`p-4 rounded-xl flex items-center gap-3 ${
        darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
      }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
        }`}>
          <Building2 className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-content-primary'}`}>
            {selectedProvider?.name}
          </div>
          <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
            {selectedProvider?.clinic}
          </div>
        </div>
        <button
          onClick={onChangeProvider}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            darkMode ? 'text-purple-400 hover:bg-surface-sunken' : 'text-purple-600 hover:bg-purple-50'
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
                      ? 'border-stroke-subtle hover:border-stroke-default'
                      : 'border-stroke-subtle hover:border-stroke-default'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selected
                    ? darkMode ? 'bg-purple-900/40' : 'bg-purple-100'
                    : darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    selected
                      ? darkMode ? 'text-purple-400' : 'text-purple-600'
                      : darkMode ? 'text-content-secondary' : 'text-content-secondary'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    selected
                      ? darkMode ? 'text-purple-300' : 'text-purple-800'
                      : darkMode ? 'text-content-primary' : 'text-content-primary'
                  }`}>
                    {label}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
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
            <label className={`block text-xs mb-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onSetDateFrom(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>To</label>
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
                  ? 'border-stroke-subtle hover:border-stroke-default'
                  : 'border-stroke-subtle hover:border-stroke-default'
            }`}
          >
            <Clock className={`w-5 h-5 mx-auto mb-1 ${
              urgency === 'routine'
                ? darkMode ? 'text-purple-400' : 'text-purple-600'
                : darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`} />
            <div className={`text-sm font-medium ${
              urgency === 'routine'
                ? darkMode ? 'text-purple-300' : 'text-purple-800'
                : darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>Routine</div>
            <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>5-10 business days</div>
          </button>
          <button
            onClick={() => onSetUrgency('urgent')}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              urgency === 'urgent'
                ? darkMode
                  ? 'border-amber-600 bg-amber-900/20'
                  : 'border-amber-500 bg-amber-50'
                : darkMode
                  ? 'border-stroke-subtle hover:border-stroke-default'
                  : 'border-stroke-subtle hover:border-stroke-default'
            }`}
          >
            <Send className={`w-5 h-5 mx-auto mb-1 ${
              urgency === 'urgent'
                ? darkMode ? 'text-amber-400' : 'text-amber-600'
                : darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`} />
            <div className={`text-sm font-medium ${
              urgency === 'urgent'
                ? darkMode ? 'text-amber-300' : 'text-amber-800'
                : darkMode ? 'text-content-primary' : 'text-content-secondary'
            }`}>Urgent</div>
            <div className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>1-3 business days</div>
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

      <IdentityVerificationCard
        darkMode={darkMode}
        profileLoaded={profileLoaded}
        editDob={editDob}
        editPhone={editPhone}
        editEmail={editEmail}
        onSetDob={onSetDob}
        onSetPhone={onSetPhone}
        onSetEmail={onSetEmail}
        inputClasses={inputClasses}
      />
    </div>
  );
}

function SubmittedStep({ darkMode, selectedProvider, selectedTypes, urgency, emailSent, emailError, onClose }: {
  darkMode: boolean;
  selectedProvider: ProviderOption | null;
  selectedTypes: RecordKind[];
  urgency: 'routine' | 'urgent';
  emailSent: boolean;
  emailError?: string;
  onClose: () => void;
}) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
        emailSent
          ? darkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'
          : darkMode ? 'bg-amber-900/30' : 'bg-amber-100'
      }`}>
        {emailSent ? (
          <CheckCircle className={`w-8 h-8 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
        ) : (
          <AlertCircle className={`w-8 h-8 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
        )}
      </div>
      <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-content-primary'}`}>
        {emailSent ? 'Request Sent' : 'Request Saved'}
      </h3>
      <p className={`text-sm max-w-xs mb-2 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
        {emailSent ? (
          <>Your request has been sent to <span className="font-medium">{selectedProvider?.name}</span>. You'll be notified when records are available.</>
        ) : (
          <>Your request has been saved but the email could not be delivered.</>
        )}
      </p>
      {emailSent ? (
        <p className={`text-xs mb-6 flex items-center gap-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <Mail className="w-3.5 h-3.5" />
          Email delivered to provider
        </p>
      ) : (
        <div className="mb-6">
          <p className={`text-xs flex items-center justify-center gap-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            Email delivery failed
          </p>
          {emailError && (
            <p className={`text-[11px] mt-2 max-w-xs break-all ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
              {emailError}
            </p>
          )}
        </div>
      )}
      <div className={`w-full max-w-sm p-4 rounded-xl text-left ${
        darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
      }`}>
        <div className={`text-xs font-medium uppercase tracking-wider mb-3 ${
          darkMode ? 'text-content-secondary' : 'text-content-secondary'
        }`}>Request Summary</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Provider</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>{selectedProvider?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Records</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>{selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Priority</span>
            <span className={`text-sm font-medium capitalize ${
              urgency === 'urgent'
                ? darkMode ? 'text-amber-400' : 'text-amber-600'
                : darkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>{urgency}</span>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Est. Delivery</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-content-primary'}`}>
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

function IdentityVerificationCard({ darkMode, profileLoaded, editDob, editPhone, editEmail, onSetDob, onSetPhone, onSetEmail, inputClasses }: {
  darkMode: boolean;
  profileLoaded: boolean;
  editDob: string;
  editPhone: string;
  editEmail: string;
  onSetDob: (v: string) => void;
  onSetPhone: (v: string) => void;
  onSetEmail: (v: string) => void;
  inputClasses: string;
}) {
  if (!profileLoaded) {
    return (
      <div className={`p-4 rounded-xl border ${darkMode ? 'border-stroke-default bg-surface-sunken/50' : 'border-stroke-subtle bg-surface-sunken'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 border-2 rounded-full animate-spin ${darkMode ? 'border-stroke-default border-t-content-secondary' : 'border-stroke-default border-t-content-secondary'}`} />
          <span className={`text-sm ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Loading your verification info...</span>
        </div>
      </div>
    );
  }

  const allComplete = editDob && editPhone && editEmail;

  return (
    <div className={`rounded-xl border overflow-hidden ${
      allComplete
        ? darkMode ? 'border-emerald-800/50 bg-emerald-950/10' : 'border-emerald-200 bg-emerald-50/30'
        : darkMode ? 'border-amber-800/50 bg-amber-950/10' : 'border-amber-200 bg-amber-50/30'
    }`}>
      <div className={`px-4 py-3 flex items-center gap-2 border-b ${
        allComplete
          ? darkMode ? 'border-emerald-800/30' : 'border-emerald-200/60'
          : darkMode ? 'border-amber-800/30' : 'border-amber-200/60'
      }`}>
        <ShieldCheck className={`w-4 h-4 ${
          allComplete
            ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
            : darkMode ? 'text-amber-400' : 'text-amber-600'
        }`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          allComplete
            ? darkMode ? 'text-emerald-400' : 'text-emerald-700'
            : darkMode ? 'text-amber-400' : 'text-amber-700'
        }`}>
          {allComplete ? 'Identity Verification Ready' : 'Complete Your Identity Info'}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {allComplete ? (
          <p className={`text-xs ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>
            Your date of birth, phone, and email will be included in the request to help the provider verify your identity.
          </p>
        ) : (
          <p className={`text-xs ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
            The provider needs this information to verify your identity. Please complete any missing fields below.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2.5">
          {(!editDob || !allComplete) && (
            <div>
              <label className={`block text-[11px] font-medium mb-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Date of Birth</label>
              <input
                type="date"
                value={editDob}
                onChange={(e) => onSetDob(e.target.value)}
                className={`${inputClasses} !py-2 text-sm`}
              />
            </div>
          )}
          {(!editPhone || !allComplete) && (
            <div>
              <label className={`block text-[11px] font-medium mb-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Phone Number</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => onSetPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className={`${inputClasses} !py-2 text-sm`}
              />
            </div>
          )}
          {(!editEmail || !allComplete) && (
            <div>
              <label className={`block text-[11px] font-medium mb-1 ${darkMode ? 'text-content-secondary' : 'text-content-secondary'}`}>Email Address</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => onSetEmail(e.target.value)}
                placeholder="you@example.com"
                className={`${inputClasses} !py-2 text-sm`}
              />
            </div>
          )}
        </div>
        {allComplete && (
          <div className={`flex items-center gap-2 pt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">All verification fields complete</span>
          </div>
        )}
      </div>
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
        : darkMode ? 'bg-surface-sunken text-content-secondary' : 'bg-surface-overlay text-content-secondary'
    }`}>
      {step}
    </div>
  );
}
