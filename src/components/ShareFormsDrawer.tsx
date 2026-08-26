import { useState, useMemo } from 'react';
import { Drawer } from './ui/Drawer';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { HorizontalMedicalIDCard } from './HorizontalMedicalIDCard';
import { supabase } from '../lib/supabase';

export type FormSummary = {
  id: string;
  title: string;
  version: string;
  signedAt?: string;
  updatedAt?: string;
};

export type PatientSummary = {
  id: string;
  name: string;
  birthDate?: string;
};

type RecipientMethod = 'SecureLink' | 'Direct' | 'FHIR';

type Recipient = {
  displayName: string;
  orgName?: string;
  email?: string;
  directAddress?: string;
  fhirEndpoint?: string;
  npi?: string;
  method: RecipientMethod;
};

export function ShareFormsDrawer({
  open,
  onOpenChange,
  selectedForms,
  patient,
  onShared,
  darkMode = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedForms: FormSummary[];
  patient: PatientSummary;
  onShared?: (shareEventId: string) => void;
  darkMode?: boolean;
}) {
  const [recipient, setRecipient] = useState<Recipient>({
    displayName: '',
    method: 'SecureLink',
  });
  const [message, setMessage] = useState('');
  const [includeCcMe, setIncludeCcMe] = useState(true);
  const [includeCcPatient, setIncludeCcPatient] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ack, setAck] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  const canSend = useMemo(() => {
    const hasForms = selectedForms?.length > 0;
    const hasName = recipient.displayName.trim().length > 1;
    const hasDest = !!recipient.email;
    return hasForms && hasName && hasDest && agree && !isSending;
  }, [recipient, selectedForms, agree, isSending]);

  async function handleSend() {
    setIsSending(true);
    setError(null);
    setAck(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in again before sharing forms.');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          patientId: patient.id,
          forms: selectedForms,
          recipient: {
            ...recipient,
            patientName: patient.name,
            patientDob: patient.birthDate,
            providerName: recipient.displayName,
          },
          note: message,
          options: {
            package: { pdf: true, fhirBundle: true },
            cc: { me: includeCcMe, patient: includeCcPatient },
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Share failed: ${res.status}`);
      const providerStatus = data.emailSent ? 'sent' : `failed${data.emailError ? ` (${data.emailError})` : ''}`;
      const receiptStatus = data.patientReceiptSent ? 'sent' : `failed${data.patientReceiptError ? ` (${data.patientReceiptError})` : ''}`;
      setAck(`Secure share created. Provider email: ${providerStatus}. Patient receipt: ${receiptStatus}. Share link: ${data.shareUrl}`);
      onShared?.(data?.id ?? '');
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setIsSending(false);
    }
  }

  const handleMethodChange = (method: RecipientMethod) => {
    setRecipient({ ...recipient, method });
  };

  return (
    <Drawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      position="right"
      size="large"
      title="Share selected forms"
      className={`${darkMode ? '!bg-surface-overlay' : '!bg-surface-overlay'} !max-w-2xl !w-full ${darkMode ? '[&_.border-gray-200]:!border-stroke-subtle' : ''} ${darkMode ? '[&_h2]:!text-content-primary' : ''} ${darkMode ? '[&>div>div:first-child]:!border-stroke-subtle' : ''} [&>div>div:first-child_button]:${darkMode ? '!text-content-secondary hover:!text-content-primary hover:!bg-surface-sunken' : ''} [&>div>div:nth-child(2)]:!border-l-0`}
    >
      <div className={`flex-1 overflow-y-auto p-4 ${'bg-surface-raised'}`}>
        <div className="space-y-6">
            <div className={`text-sm font-bold ${'text-content-primary'}`}>
              Patient
            </div>

            <HorizontalMedicalIDCard darkMode={darkMode} />

            <div className={`border-t ${'border-stroke-subtle'}`} />

            <section>
              <h3 className={`text-sm font-medium mb-3 ${'text-content-primary'}`}>
                Included forms
              </h3>
              <ul className="space-y-2">
                {selectedForms.map((f) => (
                  <li
                    key={f.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      darkMode
                        ? 'border-stroke-default bg-surface-sunken'
                        : 'border-stroke-subtle bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${'bg-surface-sunken'}`}>
                        <FileText className={`w-4 h-4 ${'text-content-secondary'}`} />
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${'text-content-primary'}`}>
                          {f.title}
                        </div>
                        <div className={`text-xs ${'text-content-secondary'}`}>
                          v{f.version}
                          {f.signedAt && ` • signed ${new Date(f.signedAt).toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        darkMode
                          ? 'bg-surface-sunken text-content-primary'
                          : 'bg-surface-sunken text-content-primary'
                      }`}
                    >
                      PDF + FHIR
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div className={`border-t ${'border-stroke-subtle'}`} />

            <section className="space-y-4">
              <h3 className={`text-sm font-medium ${'text-content-primary'}`}>
                Recipient
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="recipientName" className={`block text-sm font-medium mb-1 ${'text-content-primary'}`}>
                    Name
                  </label>
                  <input
                    id="recipientName"
                    type="text"
                    placeholder="Dr. Jane Smith"
                    value={recipient.displayName}
                    onChange={(e) =>
                      setRecipient({ ...recipient, displayName: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder'
                        : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="org" className={`block text-sm font-medium mb-1 ${'text-content-primary'}`}>
                    Organization (optional)
                  </label>
                  <input
                    id="org"
                    type="text"
                    placeholder="Bay Clinic"
                    value={recipient.orgName || ''}
                    onChange={(e) =>
                      setRecipient({ ...recipient, orgName: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                      darkMode
                        ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder'
                        : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-1 ${'text-content-primary'}`}>
                  Recipient email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane.smith@clinic.org"
                  value={recipient.email || ''}
                  onChange={(e) =>
                    setRecipient({ ...recipient, email: e.target.value })
                  }
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder'
                      : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="note" className={`block text-sm font-medium mb-1 ${'text-content-primary'}`}>
                  Message (optional)
                </label>
                <textarea
                  id="note"
                  placeholder="Short note to the provider"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder'
                      : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder'
                  }`}
                />
                <p className={`text-xs mt-1 ${'text-content-secondary'}`}>
                  Attachments: PDF packet + FHIR Bundle (JSON).
                </p>
              </div>
            </section>

            <div className={`border-t ${'border-stroke-subtle'}`} />

            <section className="space-y-3 pb-6">
              <Checkbox
                checked={agree}
                onChange={setAgree}
                label="I authorize sharing the selected forms for treatment purposes. I understand I can revoke link access later in the 'Shared With' tab."
                size="16px"
                className={darkMode ? 'text-content-secondary' : ''}
              />

              {(error || ack) && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    error
                      ? darkMode
                        ? 'bg-red-900/20 text-red-400 border border-red-800'
                        : 'bg-red-50 text-red-800 border border-red-200'
                      : darkMode
                      ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {error ? (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>{error || ack}</span>
                </div>
              )}
            </section>
        </div>
      </div>

      <div className={`sticky bottom-0 p-4 border-t ${
        darkMode ? 'bg-surface-overlay border-stroke-subtle' : 'bg-surface-raised border-stroke-subtle'
      }`}>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-1"
          >
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
