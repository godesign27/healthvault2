import { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, Mail, X, FlaskConical, ScanLine, Microscope, Stethoscope, FileText, Loader2, Clock, ShieldCheck } from 'lucide-react';
import { RecordKind } from '../../lib/records/types';
import { createRecordRequest } from '../../lib/records/requests-api';
import { supabase } from '../../lib/supabase';

async function fetchPatientIdentity(): Promise<{ dateOfBirth: string; phone: string; email: string }> {
  const result = { dateOfBirth: '', phone: '', email: '' };
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

async function saveIdentityFields(fields: { dateOfBirth?: string; phone?: string; email?: string }): Promise<boolean> {
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

const RECORD_TYPES = [
  { kind: RecordKind.Lab, label: 'Lab Results', icon: FlaskConical },
  { kind: RecordKind.Imaging, label: 'Imaging & Scans', icon: ScanLine },
  { kind: RecordKind.Pathology, label: 'Pathology Reports', icon: Microscope },
  { kind: RecordKind.SpecialistReport, label: 'Specialist Reports', icon: Stethoscope },
  { kind: RecordKind.Other, label: 'Other Records', icon: FileText },
];

interface InlineRecordRequestFormProps {
  onComplete: (result: { providerName: string; emailSent: boolean; emailError?: string }) => void;
  onCancel: () => void;
  onRequestSent?: () => void;
}

export function InlineRecordRequestForm({ onComplete, onCancel, onRequestSent }: InlineRecordRequestFormProps) {
  const [providerName, setProviderName] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<RecordKind[]>([]);
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editDob, setEditDob] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savedProfile, setSavedProfile] = useState({ dateOfBirth: '', phone: '', email: '' });

  useEffect(() => {
    fetchPatientIdentity().then(p => {
      setSavedProfile(p);
      setEditDob(p.dateOfBirth);
      setEditPhone(p.phone);
      setEditEmail(p.email);
      setProfileLoaded(true);
    });
  }, []);

  const toggleType = (kind: RecordKind) => {
    setSelectedTypes(prev =>
      prev.includes(kind) ? prev.filter(k => k !== kind) : [...prev, kind]
    );
  };

  const identityComplete = editDob && editPhone && editEmail;
  const canSubmit = providerName.trim() && providerEmail.trim() && selectedTypes.length > 0 && identityComplete;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!identityComplete) {
      setError('Please complete your identity information before sending.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const updates: { dateOfBirth?: string; phone?: string; email?: string } = {};
      if (editDob && editDob !== savedProfile.dateOfBirth) updates.dateOfBirth = editDob;
      if (editPhone && editPhone !== savedProfile.phone) updates.phone = editPhone;
      if (editEmail && editEmail !== savedProfile.email) updates.email = editEmail;
      if (Object.keys(updates).length > 0) {
        await saveIdentityFields(updates);
      }

      const result = await createRecordRequest({
        providerName: providerName.trim(),
        providerEmail: providerEmail.trim(),
        doctorName: doctorName.trim() || undefined,
        recordTypes: selectedTypes,
        message: message.trim() || undefined,
        urgency,
      });
      onRequestSent?.();
      onComplete({
        providerName: providerName.trim(),
        emailSent: result.emailSent,
        emailError: result.emailError || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = 'w-full px-3 py-2.5 rounded-lg border border-stroke-subtle text-sm text-content-primary placeholder:text-content-placeholder outline-none focus:border-stroke-strong transition-colors bg-white';

  return (
    <div className="rounded-2xl border border-stroke-subtle bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stroke-subtle bg-surface-sunken">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-content-secondary" />
          <span className="text-sm font-semibold text-content-primary">Request Health Records</span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-md hover:bg-surface-overlay transition-colors text-content-secondary hover:text-content-secondary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-content-secondary mb-1.5">Provider / Facility *</label>
          <input
            type="text"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder="e.g. Springfield Medical Center"
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-content-secondary mb-1.5">Provider Email *</label>
          <input
            type="email"
            value={providerEmail}
            onChange={(e) => setProviderEmail(e.target.value)}
            placeholder="records@provider.com"
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-content-secondary mb-1.5">Doctor's Name</label>
          <input
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Sarah Chen (optional)"
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-content-secondary mb-1.5">Record Types *</label>
          <div className="flex flex-wrap gap-2">
            {RECORD_TYPES.map(({ kind, label, icon: Icon }) => {
              const selected = selectedTypes.includes(kind);
              return (
                <button
                  key={kind}
                  onClick={() => toggleType(kind)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selected
                      ? 'border-stroke-subtle bg-surface-sunken text-white'
                      : 'border-stroke-subtle bg-white text-content-secondary hover:border-stroke-default hover:bg-surface-sunken'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-content-secondary mb-1.5">Priority</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setUrgency('routine')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                urgency === 'routine'
                  ? 'border-stroke-subtle bg-surface-sunken text-white'
                  : 'border-stroke-subtle text-content-secondary hover:border-stroke-default'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Routine
            </button>
            <button
              onClick={() => setUrgency('urgent')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                urgency === 'urgent'
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-stroke-subtle text-content-secondary hover:border-stroke-default'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Urgent
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-content-secondary mb-1.5">Message to Provider</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Any details to help locate your records..."
            className={`${inputClasses} resize-none`}
          />
        </div>

        <div className={`rounded-xl border overflow-hidden ${
          identityComplete
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-amber-200 bg-amber-50/30'
        }`}>
          <div className={`px-3 py-2.5 flex items-center gap-2 border-b ${
            identityComplete ? 'border-emerald-200/60' : 'border-amber-200/60'
          }`}>
            <ShieldCheck className={`w-4 h-4 ${identityComplete ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${
              identityComplete ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {identityComplete ? 'Identity Verification Ready' : 'Complete Your Identity Info'}
            </span>
          </div>
          <div className="px-3 py-3 space-y-2.5">
            {!profileLoaded ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-content-secondary" />
                <span className="text-xs text-content-secondary">Loading verification info...</span>
              </div>
            ) : (
              <>
                {identityComplete ? (
                  <p className="text-xs text-content-secondary">
                    Your date of birth, phone, and email will be included to help verify your identity.
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">
                    The provider needs this information to verify your identity. Please complete any missing fields.
                  </p>
                )}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-medium text-content-secondary mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className={`${inputClasses} !py-2`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-content-secondary mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="(555) 555-5555"
                      className={`${inputClasses} !py-2`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-content-secondary mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`${inputClasses} !py-2`}
                    />
                  </div>
                </div>
                {identityComplete && (
                  <div className="flex items-center gap-1.5 pt-0.5 text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">All verification fields complete</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-raised text-white text-sm font-medium hover:bg-surface-sunken disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Request
            </>
          )}
        </button>
      </div>
    </div>
  );
}
