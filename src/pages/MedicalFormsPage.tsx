import { CheckCircle2, Clock, FileText, Share2, Users, ClipboardList, Upload, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { FormDrawer } from '../components/FormDrawer';
import { ShareFormsDrawer, FormSummary, PatientSummary } from '../components/ShareFormsDrawer';
import { SharedWithDrawer, SharedFormEvent } from '../components/SharedWithDrawer';
import { supabase } from '../lib/supabase';
import {
  FORM_TEMPLATES,
  FORM_CATEGORY_ORDER,
  FORM_TEMPLATE_VERSION,
  FormTemplateDef,
} from '../lib/forms/catalog';
import {
  getPatientProfileId,
  loadFormResponses,
  isResponseComplete,
  FormResponseMap,
} from '../lib/forms/responses';
import {
  loadFormAutofillContext,
  FormAutofillContext,
} from '../lib/forms/autopopulate';

interface MedicalFormsPageProps {
  darkMode?: boolean;
}

export function MedicalFormsPage({ darkMode = false }: MedicalFormsPageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplateDef | null>(null);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [sharedWithDrawerOpen, setSharedWithDrawerOpen] = useState(false);
  const [sharedForms, setSharedForms] = useState<SharedFormEvent[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<PatientSummary | null>(null);

  const [patientProfileId, setPatientProfileId] = useState<string | null>(null);
  const [responses, setResponses] = useState<FormResponseMap>({});
  const [loadingForms, setLoadingForms] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autofillContext, setAutofillContext] = useState<FormAutofillContext | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resolve the authenticated patient + load their form responses once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) { setLoadingForms(false); return; }
      const userId = session.user.id;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, date_of_birth')
        .eq('user_id', userId)
        .maybeSingle();

      const fullName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : '';

      if (cancelled) return;
      setCurrentPatient({
        id: userId,
        name: fullName || session.user.email || '',
        birthDate: profile?.date_of_birth || '',
      });

      const profileId = await getPatientProfileId(userId);
      if (cancelled) return;
      setPatientProfileId(profileId);

      const [responsesResult, autofill] = await Promise.all([
        profileId ? loadFormResponses(profileId).catch((err) => {
          console.error('Failed to load form responses:', err);
          return {} as FormResponseMap;
        }) : Promise.resolve({} as FormResponseMap),
        loadFormAutofillContext(userId),
      ]);

      if (!cancelled) {
        setResponses(responsesResult);
        setAutofillContext(autofill);
        setLoadingForms(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loadingForms || selectedTemplate) return;
    const requestedForm = sessionStorage.getItem('hv-medical-form');
    if (!requestedForm) return;
    sessionStorage.removeItem('hv-medical-form');
    const template = FORM_TEMPLATES.find(({ id }) => id === requestedForm);
    if (template) {
      setSelectedTemplate(template);
      setDrawerOpen(true);
    }
  }, [loadingForms, selectedTemplate]);

  useEffect(() => {
    if (loadingForms) return;
    const requestedAction = sessionStorage.getItem('hv-medical-form-action');
    if (requestedAction !== 'upload') return;
    sessionStorage.removeItem('hv-medical-form-action');
    setUploadOpen(true);
  }, [loadingForms]);

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadMessage({ type: 'error', text: 'Choose a PDF or clear photo first.' });
      return;
    }
    setUploading(true);
    setUploadMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Sign in to upload a provider form.');
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const storagePath = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: storageError } = await supabase.storage
        .from('medical-form-uploads')
        .upload(storagePath, uploadFile, { contentType: uploadFile.type, upsert: false });
      if (storageError) throw storageError;
      const { error: rowError } = await supabase.from('medical_form_uploads').insert({
        user_id: session.user.id,
        patient_id: patientProfileId,
        original_filename: uploadFile.name,
        title: uploadTitle.trim() || uploadFile.name,
        notes: uploadNotes.trim() || null,
        storage_path: storagePath,
        mime_type: uploadFile.type,
        size_bytes: uploadFile.size,
      });
      if (rowError) {
        await supabase.storage.from('medical-form-uploads').remove([storagePath]);
        throw rowError;
      }
      setUploadMessage({ type: 'success', text: 'Provider form uploaded securely. It is ready for review in Health Vault.' });
      setUploadFile(null);
      setUploadTitle('');
      setUploadNotes('');
    } catch (error) {
      setUploadMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to upload the form.' });
    } finally {
      setUploading(false);
    }
  };

  const refreshResponses = async () => {
    if (!patientProfileId) return;
    try {
      const map = await loadFormResponses(patientProfileId);
      setResponses(map);
    } catch (err) {
      console.error('Failed to refresh form responses:', err);
    }
  };

  const loadSharedForms = async () => {
    setLoadingShared(true);
    try {
      const patientId = currentPatient?.id;
      if (!patientId) { setLoadingShared(false); return; }
      const { data, error } = await supabase
        .from('share_events')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: SharedFormEvent[] = (data || []).map((event: any) => ({
        id: event.id,
        formTitle: Array.isArray(event.form_response_ids)
          ? `${event.form_response_ids.length} form${event.form_response_ids.length !== 1 ? 's' : ''}`
          : 'Unknown form',
        recipientName: event.recipient?.providerName || event.recipient?.displayName || 'Unknown',
        recipientEmail: event.recipient?.email || event.recipient?.directAddress || event.recipient?.fhirEndpoint,
        sharedDate: event.sent_at,
        status: event.status,
        method: event.method,
      }));

      setSharedForms(formattedData);
    } catch (error) {
      console.error('Error loading shared forms:', error);
    } finally {
      setLoadingShared(false);
    }
  };

  useEffect(() => {
    if (currentPatient?.id) loadSharedForms();
  }, [currentPatient?.id]);

  const categories = useMemo(() => {
    return FORM_CATEGORY_ORDER.map((name) => {
      const forms = FORM_TEMPLATES.filter((t) => t.category === name);
      const completed = forms.filter((t) => isResponseComplete(responses[t.id])).length;
      return { name, forms, completed, total: forms.length };
    }).filter((c) => c.forms.length > 0);
  }, [responses]);

  const totalForms = FORM_TEMPLATES.length;
  const completedForms = FORM_TEMPLATES.filter((t) => isResponseComplete(responses[t.id])).length;
  const incompleteForms = totalForms - completedForms;
  const completionPercentage = totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0;

  const toggleSelect = (templateId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  };

  const handleFormClick = (template: FormTemplateDef) => {
    setSelectedTemplate(template);
    setDrawerOpen(true);
  };

  // Selected forms that are complete, mapped to their form_responses UUID (what `share` expects).
  const getSelectedForms = (): FormSummary[] => {
    const out: FormSummary[] = [];
    FORM_TEMPLATES.forEach((t) => {
      const resp = responses[t.id];
      if (selectedIds.has(t.id) && isResponseComplete(resp) && resp) {
        out.push({
          id: resp.id,
          title: t.title,
          version: FORM_TEMPLATE_VERSION,
          signedAt: resp.signed_at || undefined,
        });
      }
    });
    return out;
  };

  const completedSelectedCount = getSelectedForms().length;

  const handleShareSingle = (templateId: string) => {
    setSelectedIds(new Set([templateId]));
    setShareDrawerOpen(true);
  };

  return (
    <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-content-primary">
            <ClipboardList className="w-7 h-7" />
            Medical Forms
          </h1>
          <p className="text-content-secondary">Complete and manage your healthcare documentation</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setUploadOpen(true)}
            className="px-6 py-3 font-medium rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload provider form
          </button>
          <button
            onClick={() => setShareDrawerOpen(true)}
            disabled={completedSelectedCount === 0}
            className={`px-6 py-3 font-medium rounded-lg transition-colors flex items-center gap-2 ${
            completedSelectedCount === 0
              ? 'bg-action-primary-disabled text-content-on-action cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Share2 className="w-5 h-5" />
            Share {completedSelectedCount} Selected
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="hv-surface-card p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-content-secondary">Completed</h3>
            <div className="p-2.5 rounded-lg bg-surface-sunken">
              <CheckCircle2 className="w-5 h-5 text-content-secondary" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-content-primary">{loadingForms ? '—' : completedForms}</p>
          <p className="text-sm text-content-secondary">of {totalForms} total</p>
        </div>

        <div className="hv-surface-card p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-content-secondary">Incomplete</h3>
            <div className="p-2.5 rounded-lg bg-surface-sunken">
              <Clock className="w-5 h-5 text-content-secondary" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-content-primary">{loadingForms ? '—' : incompleteForms}</p>
          <p className="text-sm text-content-secondary">of {totalForms} total</p>
        </div>

        <div className="hv-surface-card p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-content-secondary">Completion</h3>
            <div className="p-2.5 rounded-lg bg-surface-sunken">
              <FileText className="w-5 h-5 text-content-secondary" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-content-primary">{loadingForms ? '—' : `${completionPercentage}%`}</p>
        </div>

        <div
          onClick={() => setSharedWithDrawerOpen(true)}
          className="hv-surface-card hv-surface-card--interactive cursor-pointer p-6 transition-all hover:bg-action-secondary"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-content-secondary">Shared With</h3>
            <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-surface-sunken' : 'bg-indigo-50'}`}>
              <Users className={`w-5 h-5 ${darkMode ? 'text-content-secondary' : 'text-indigo-600'}`} />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-content-primary">
            {loadingShared ? '...' : sharedForms.length}
          </p>
          <p className="text-sm text-content-secondary">
            {sharedForms.length === 1 ? 'recipient' : 'recipients'}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {categories.map((category) => {
          const percentage = category.total > 0 ? Math.round((category.completed / category.total) * 100) : 0;

          return (
            <div key={category.name} className="space-y-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-content-primary">{category.name}</h2>
                </div>
                <div className="text-right">
                  <div className="w-48 rounded-full h-2 mb-2 bg-surface-sunken">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-content-secondary">
                    {category.completed} of {category.total} completed ({percentage}%)
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {category.forms.map((template) => {
                  const complete = isResponseComplete(responses[template.id]);
                  const selected = selectedIds.has(template.id);
                  return (
                    <div
                      key={template.id}
                      className="hv-surface-card hv-surface-card--interactive flex cursor-pointer items-center gap-4 rounded-lg p-4 transition-colors hover:bg-action-secondary"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).getAttribute('type') !== 'checkbox') {
                          handleFormClick(template);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!complete}
                        onChange={() => toggleSelect(template.id)}
                        onClick={(e) => e.stopPropagation()}
                        title={complete ? 'Select to share' : 'Complete this form to share it'}
                        className="w-5 h-5 rounded border-stroke-default text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      />

                      <div className={`p-3 rounded-lg shrink-0 ${darkMode ? 'bg-surface-sunken' : 'bg-indigo-50'}`}>
                        <FileText className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 text-content-primary">{template.title}</h3>
                        <p className="text-sm text-content-secondary">{template.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {complete ? (
                          <span className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            Complete
                          </span>
                        ) : (
                          <span className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shrink-0">
                            <Clock className="w-4 h-4" />
                            Incomplete
                          </span>
                        )}
                        {complete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareSingle(template.id);
                            }}
                            className="p-2.5 text-indigo-600 hover:bg-surface-sunken rounded-lg transition-colors"
                            title="Share this form"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTemplate && (
        <FormDrawer
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          patientProfileId={patientProfileId}
          response={responses[selectedTemplate.id]}
          autofillContext={autofillContext}
          darkMode={darkMode}
          onSaved={refreshResponses}
          onShareClick={() => {
            setDrawerOpen(false);
            handleShareSingle(selectedTemplate.id);
          }}
        />
      )}

      <ShareFormsDrawer
        open={shareDrawerOpen}
        onOpenChange={setShareDrawerOpen}
        selectedForms={getSelectedForms()}
        patient={currentPatient || { id: '', name: '', birthDate: '' }}
        onShared={() => {
          loadSharedForms();
          setSelectedIds(new Set());
          setTimeout(() => {
            setShareDrawerOpen(false);
          }, 2000);
        }}
        darkMode={darkMode}
      />

      <SharedWithDrawer
        open={sharedWithDrawerOpen}
        onOpenChange={setSharedWithDrawerOpen}
        sharedForms={sharedForms}
        onRevoke={async (eventId: string) => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) throw new Error('Not authenticated');
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share/${eventId}/revoke`;
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (!res.ok) throw new Error('Failed to revoke');
          await loadSharedForms();
        }}
        darkMode={darkMode}
      />

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-form-title">
          <div className="hv-surface-card w-full max-w-lg p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="upload-form-title" className="text-xl font-bold text-content-primary">Upload a provider form</h2>
                <p className="mt-1 text-sm text-content-secondary">PDF, PNG, or JPEG. Maximum 10 MB. Files remain private to your account.</p>
              </div>
              <button onClick={() => setUploadOpen(false)} className="rounded-lg p-2 text-content-secondary hover:bg-action-secondary" aria-label="Close upload form"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-content-primary">File
                <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-lg border border-stroke-default p-3 text-sm" />
              </label>
              <label className="block text-sm font-medium text-content-primary">Form name <span className="font-normal text-content-secondary">(optional)</span>
                <input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} maxLength={160} placeholder="Example: New patient intake" className="mt-2 block w-full rounded-lg border border-stroke-default bg-surface-primary p-3 text-content-primary" />
              </label>
              <label className="block text-sm font-medium text-content-primary">Notes <span className="font-normal text-content-secondary">(optional)</span>
                <textarea value={uploadNotes} onChange={(event) => setUploadNotes(event.target.value)} maxLength={1000} rows={3} placeholder="Office, appointment, or deadline" className="mt-2 block w-full rounded-lg border border-stroke-default bg-surface-primary p-3 text-content-primary" />
              </label>
              {uploadMessage && <p className={`rounded-lg p-3 text-sm ${uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{uploadMessage.text}</p>}
              <button onClick={handleUpload} disabled={!uploadFile || uploading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Upload className="h-5 w-5" />
                {uploading ? 'Uploading securely…' : 'Upload securely'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
