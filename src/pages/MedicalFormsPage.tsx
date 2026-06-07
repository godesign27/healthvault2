import { CheckCircle2, Clock, FileText, Share2, Users, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FormDrawer } from '../components/FormDrawer';
import { ShareFormsDrawer, FormSummary, PatientSummary } from '../components/ShareFormsDrawer';
import { SharedWithDrawer, SharedFormEvent } from '../components/SharedWithDrawer';
import { supabase } from '../lib/supabase';

interface FormItem {
  id: string;
  title: string;
  description: string;
  status: 'complete' | 'incomplete';
  selected: boolean;
}

interface FormCategory {
  name: string;
  completed: number;
  total: number;
  forms: FormItem[];
}

interface MedicalFormsPageProps {
  darkMode?: boolean;
}

export function MedicalFormsPage({ darkMode = false }: MedicalFormsPageProps) {
  const [selectedCount, setSelectedCount] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(null);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [sharedWithDrawerOpen, setSharedWithDrawerOpen] = useState(false);
  const [sharedForms, setSharedForms] = useState<SharedFormEvent[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<PatientSummary | null>(null);

  // Resolve the authenticated patient once on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const userId = session.user.id;
      // Fetch name from user_profiles, fall back to email
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, date_of_birth')
        .eq('id', userId)
        .maybeSingle();
      setCurrentPatient({
        id: userId,
        name: profile?.full_name || session.user.email || '',
        birthDate: profile?.date_of_birth || '',
      });
    });
  }, []);

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

  const [categories, setCategories] = useState<FormCategory[]>([
    {
      name: 'Identification',
      completed: 2,
      total: 3,
      forms: [
        {
          id: 'patient-reg',
          title: 'Patient Registration',
          description: 'Basic demographics, contact, and emergency contacts.',
          status: 'complete',
          selected: true
        },
        {
          id: 'medical-id',
          title: 'Medical ID Information',
          description: 'Allergies, meds, providers, pharmacy, and blood type.',
          status: 'complete',
          selected: false
        },
        {
          id: 'medical-history',
          title: 'Medical History',
          description: 'Past conditions, surgeries, hospitalizations, family history.',
          status: 'incomplete',
          selected: false
        }
      ]
    },
    {
      name: 'Legal & Consent',
      completed: 1,
      total: 4,
      forms: [
        {
          id: 'hipaa',
          title: 'HIPAA Authorization & Privacy',
          description: 'Consent to use/disclose health info per HIPAA.',
          status: 'complete',
          selected: false
        },
        {
          id: 'consent-treat',
          title: 'Consent to Treat',
          description: 'General consent for medical treatment and procedures.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'privacy-practices',
          title: 'Notice of Privacy Practices',
          description: 'Acknowledgment of receipt of privacy notice.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'release-info',
          title: 'Release of Information',
          description: 'Authorization to release medical records to third parties.',
          status: 'incomplete',
          selected: false
        }
      ]
    },
    {
      name: 'Care Preferences',
      completed: 0,
      total: 4,
      forms: [
        {
          id: 'advance-directives',
          title: 'Advance Directives',
          description: 'Living will, healthcare proxy, and end-of-life wishes.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'emergency-contact',
          title: 'Emergency Contact Information',
          description: 'People to contact in case of medical emergency.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'communication-prefs',
          title: 'Communication Preferences',
          description: 'Preferred methods and times for contact.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'cultural-accessibility',
          title: 'Cultural & Accessibility Preferences',
          description: 'Cultural, religious, and accessibility considerations.',
          status: 'incomplete',
          selected: false
        }
      ]
    },
    {
      name: 'Insurance & Billing',
      completed: 1,
      total: 3,
      forms: [
        {
          id: 'insurance-info',
          title: 'Insurance Information',
          description: 'Primary/secondary insurance and card uploads.',
          status: 'complete',
          selected: false
        },
        {
          id: 'financial-responsibility',
          title: 'Financial Responsibility Agreement',
          description: 'Agreement for payment of services rendered.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'payment-info',
          title: 'Payment Information',
          description: 'Billing address and payment method details.',
          status: 'incomplete',
          selected: false
        }
      ]
    },
    {
      name: 'Health & Lifestyle',
      completed: 0,
      total: 4,
      forms: [
        {
          id: 'social-history',
          title: 'Social History',
          description: 'Smoking, alcohol, exercise, and social habits.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'current-medications',
          title: 'Current Medications',
          description: 'List of all current medications and supplements.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'allergy-info',
          title: 'Allergy Information',
          description: 'Known allergies to medications, foods, and substances.',
          status: 'incomplete',
          selected: false
        },
        {
          id: 'immunization-record',
          title: 'Immunization Record',
          description: 'Vaccination history and immunization records.',
          status: 'incomplete',
          selected: false
        }
      ]
    }
  ]);

  const totalForms = categories.reduce((acc, cat) => acc + cat.total, 0);
  const completedForms = categories.reduce((acc, cat) => acc + cat.completed, 0);
  const incompleteForms = totalForms - completedForms;
  const completionPercentage = Math.round((completedForms / totalForms) * 100);

  const handleCheckboxChange = (categoryIndex: number, formIndex: number) => {
    const newCategories = [...categories];
    const currentState = newCategories[categoryIndex].forms[formIndex].selected;
    newCategories[categoryIndex].forms[formIndex].selected = !currentState;
    setCategories(newCategories);

    const newCount = newCategories.reduce((acc, cat) =>
      acc + cat.forms.filter(f => f.selected).length, 0
    );
    setSelectedCount(newCount);
  };

  const handleFormClick = (form: FormItem) => {
    setSelectedForm(form);
    setDrawerOpen(true);
  };

  const handleShareClick = () => {
    setShareDrawerOpen(true);
  };

  const getSelectedForms = (): FormSummary[] => {
    const selected: FormSummary[] = [];
    categories.forEach((category) => {
      category.forms.forEach((form) => {
        if (form.selected && form.status === 'complete') {
          selected.push({
            id: form.id,
            title: form.title,
            version: '1.0',
            signedAt: new Date().toISOString(),
          });
        }
      });
    });
    return selected;
  };

  const getCompletedSelectedCount = () => {
    let count = 0;
    categories.forEach((category) => {
      category.forms.forEach((form) => {
        if (form.selected && form.status === 'complete') {
          count++;
        }
      });
    });
    return count;
  };

  const completedSelectedCount = getCompletedSelectedCount();

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
        <button
          onClick={handleShareClick}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="hv-surface-card p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-content-secondary">Completed</h3>
            <div className="p-2.5 rounded-lg bg-surface-sunken">
              <CheckCircle2 className="w-5 h-5 text-content-secondary" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-content-primary">{completedForms}</p>
          <p className="text-sm text-content-secondary">of {totalForms} total</p>
        </div>

        <div className="hv-surface-card p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-content-secondary">Incomplete</h3>
            <div className="p-2.5 rounded-lg bg-surface-sunken">
              <Clock className="w-5 h-5 text-content-secondary" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-content-primary">{incompleteForms}</p>
          <p className="text-sm text-content-secondary">of {totalForms} total</p>
        </div>

        <div className="hv-surface-card p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-medium text-content-secondary">Completion</h3>
            <div className="p-2.5 rounded-lg bg-surface-sunken">
              <FileText className="w-5 h-5 text-content-secondary" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 text-content-primary">{completionPercentage}%</p>
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
        {categories.map((category, categoryIndex) => {
          const percentage = Math.round((category.completed / category.total) * 100);

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
                {category.forms.map((form, formIndex) => (
                  <div
                    key={form.id}
                    className="hv-surface-card hv-surface-card--interactive flex cursor-pointer items-center gap-4 rounded-lg p-4 transition-colors hover:bg-action-secondary"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).type !== 'checkbox') {
                        handleFormClick(form);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.selected}
                      onChange={() => handleCheckboxChange(categoryIndex, formIndex)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-stroke-default text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 cursor-pointer"
                    />

                    <div className={`p-3 rounded-lg shrink-0 ${darkMode ? 'bg-surface-sunken' : 'bg-indigo-50'}`}>
                      <FileText className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-content-primary">{form.title}</h3>
                      <p className="text-sm text-content-secondary">{form.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {form.status === 'complete' ? (
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
                      {form.status === 'complete' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(categoryIndex, formIndex);
                            setShareDrawerOpen(true);
                          }}
                          className="p-2.5 text-indigo-600 hover:bg-surface-sunken rounded-lg transition-colors"
                          title="Share this form"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedForm && (
        <FormDrawer
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedForm(null);
          }}
          formId={selectedForm.id}
          formTitle={selectedForm.title}
          formDescription={selectedForm.description}
          formStatus={selectedForm.status}
          darkMode={darkMode}
        />
      )}

      <ShareFormsDrawer
        open={shareDrawerOpen}
        onOpenChange={setShareDrawerOpen}
        selectedForms={getSelectedForms()}
        patient={currentPatient || { id: '', name: '', birthDate: '' }}
        onShared={(id) => {
          console.log('Shared successfully:', id);
          loadSharedForms();

          const newCategories = categories.map(category => ({
            ...category,
            forms: category.forms.map(form => ({
              ...form,
              selected: false
            }))
          }));
          setCategories(newCategories);
          setSelectedCount(0);

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
    </div>
  );
}
