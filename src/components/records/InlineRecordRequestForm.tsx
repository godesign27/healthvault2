import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Mail, X, FlaskConical, ScanLine, Microscope, Stethoscope, FileText, Loader2, Clock, ArrowLeft } from 'lucide-react';
import { RecordKind } from '../../lib/records/types';
import { createRecordRequest } from '../../lib/records/requests-api';

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

  const toggleType = (kind: RecordKind) => {
    setSelectedTypes(prev =>
      prev.includes(kind) ? prev.filter(k => k !== kind) : [...prev, kind]
    );
  };

  const canSubmit = providerName.trim() && providerEmail.trim() && selectedTypes.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
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

  const inputClasses = 'w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-stone-400 transition-colors bg-white';

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-stone-500" />
          <span className="text-sm font-semibold text-stone-800">Request Health Records</span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-md hover:bg-stone-200 transition-colors text-stone-400 hover:text-stone-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Provider / Facility *</label>
          <input
            type="text"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder="e.g. Springfield Medical Center"
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Provider Email *</label>
          <input
            type="email"
            value={providerEmail}
            onChange={(e) => setProviderEmail(e.target.value)}
            placeholder="records@provider.com"
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Doctor's Name</label>
          <input
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Sarah Chen (optional)"
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Record Types *</label>
          <div className="flex flex-wrap gap-2">
            {RECORD_TYPES.map(({ kind, label, icon: Icon }) => {
              const selected = selectedTypes.includes(kind);
              return (
                <button
                  key={kind}
                  onClick={() => toggleType(kind)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selected
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
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
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Priority</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setUrgency('routine')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                urgency === 'routine'
                  ? 'border-stone-800 bg-stone-800 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
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
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Urgent
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Message to Provider</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Any details to help locate your records..."
            className={`${inputClasses} resize-none`}
          />
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
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
